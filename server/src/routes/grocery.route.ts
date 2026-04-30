import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/requireAuth';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import NutritionPlan from '../models/nutrition.model';
import GroceryList from '../models/groceryList.model';
import SharedList from '../models/sharedList.model';
import User from '../models/user.model';
import { parseAndAggregateIngredients, formatQuantity, getCategoryEmoji } from '../utils/unitConverter';
import { generatePDF } from '../services/pdf.service';

const router = Router();

interface GroceryItem {
  name: string;
  category: string;
  quantity: string;
  checked: boolean;
}

const CATEGORIES = ['Proteins', 'Vegetables', 'Dairy', 'Grains', 'Fruits', 'Spices', 'Other'];

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    
    let groceryList = await GroceryList.findOne({ userId });
    
    if (!groceryList) {
      groceryList = await GroceryList.create({
        userId,
        items: [],
      });
    }
    
    const items = groceryList.items.map(item => ({
      name: item.name,
      category: item.category,
      quantity: formatQuantity(item.totalQuantity, item.unit),
      checked: item.isPurchased,
      isPurchased: item.isPurchased,
    }));
    
    const purchasedCount = items.filter(i => i.checked).length;
    
    res.status(200).json({
      items,
      purchasedCount,
      totalCount: items.length,
      categories: CATEGORIES,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/export/pdf', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    const groceryList = await GroceryList.findOne({ userId });

    const items = (groceryList?.items || []).map((item) => ({
      name: item.name,
      category: item.category,
      quantity: formatQuantity(item.totalQuantity, item.unit),
      checked: item.isPurchased,
    }));

    const pdfBuffer = await generatePDF('grocery', {
      title: 'Grocery List',
      generatedAt: new Date(),
      items,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="grocery-list.pdf"');
    res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

router.post('/sync', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    const daysAhead = parseInt(req.body.daysAhead as string) || 7;
    const isFamily = req.body.isFamily || false;
    
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + daysAhead);
    
    const userIds: string[] = [userId as string];
    
    if (isFamily) {
      const user = await User.findById(userId);
      if (user?.familyMembers) {
        userIds.push(...user.familyMembers.map(id => id.toString()));
      }
    }
    
    const plans = await NutritionPlan.find({
      userId: { $in: userIds },
      date: { $gte: startDate, $lt: endDate },
    });
    
    const allIngredients: Array<{ name: string; quantity: string }> = [];
    
    for (const plan of plans) {
      for (const meal of plan.meals) {
        for (const ingredient of meal.ingredients || []) {
          const match = ingredient.match(/^([\d\/\.\s]+)?\s*(.+)$/);
          if (match) {
            const qty = match[1]?.trim() || '1';
            const name = match[2]?.trim() || ingredient;
            allIngredients.push({ name, quantity: qty });
          }
        }
      }
    }
    
    const aggregated = parseAndAggregateIngredients(allIngredients);
    
    let existingList = await GroceryList.findOne({ userId });
    const existingItemsMap = new Map(
      existingList?.items.map(item => [item.name.toLowerCase(), item]) || []
    );
    
    const newItems = aggregated.map(agg => {
      const existing = existingItemsMap.get(agg.name.toLowerCase());
      
      return {
        name: agg.name,
        category: agg.category as any,
        totalQuantity: agg.totalQuantity,
        unit: agg.unit,
        isPurchased: existing?.isPurchased || false,
        consumers: existing?.consumers || [new mongoose.Types.ObjectId(userId)],
      };
    });
    
    if (existingList) {
      existingList.items = newItems;
      existingList.lastSyncedAt = new Date();
      existingList.syncedFrom = startDate;
      await existingList.save();
    } else {
      await GroceryList.create({
        userId,
        items: newItems,
        lastSyncedAt: new Date(),
        syncedFrom: startDate,
      });
    }
    
    const items = newItems.map(item => ({
      name: item.name,
      category: item.category,
      quantity: formatQuantity(item.totalQuantity, item.unit),
      checked: item.isPurchased,
    }));
    
    res.status(200).json({
      items,
      purchasedCount: items.filter(i => i.checked).length,
      totalCount: items.length,
      syncedAt: new Date(),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/toggle-item', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    const { itemName, checked } = req.body;
    
    const normalizedName = itemName.toLowerCase().trim();
    
    const groceryList = await GroceryList.findOne({ userId });
    
    if (groceryList) {
      const item = groceryList.items.find(i => i.name.toLowerCase() === normalizedName);
      if (item) {
        item.isPurchased = checked;
        await groceryList.save();
      }
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post('/add-item', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    const { name, quantity = '1', category = 'Other' } = req.body;
    
    let groceryList = await GroceryList.findOne({ userId });
    
    if (!groceryList) {
      groceryList = await GroceryList.create({ userId, items: [] });
    }
    
    const { parseAndAggregateIngredients } = require('../utils/unitConverter');
    const parsed = parseAndAggregateIngredients([{ name, quantity }]);
    const agg = parsed[0];
    
    groceryList.items.push({
      name,
      category: agg.category,
      totalQuantity: agg.totalQuantity,
      unit: agg.unit,
      isPurchased: false,
      consumers: [new mongoose.Types.ObjectId(userId)],
    });
    
    await groceryList.save();
    
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post('/share', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    
    const groceryList = await GroceryList.findOne({ userId });
    
    if (!groceryList) {
      return res.status(404).json({ error: 'No grocery list found' });
    }
    
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const sharedList = await SharedList.create({
      token,
      userId,
      items: groceryList.items.map(item => ({
        name: item.name,
        category: item.category,
        quantity: formatQuantity(item.totalQuantity, item.unit),
        isPurchased: item.isPurchased,
      })),
      expiresAt,
    });
    
    res.status(201).json({ 
      success: true, 
      shareUrl: `/shared-list/${token}`,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/shared/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    
    const sharedList = await SharedList.findOne({ token });
    
    if (!sharedList) {
      return res.status(404).json({ error: 'List not found or expired' });
    }
    
    if (new Date() > sharedList.expiresAt) {
      return res.status(410).json({ error: 'Link has expired' });
    }
    
    res.status(200).json({
      items: sharedList.items,
      expiresAt: sharedList.expiresAt,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
