import mongoose from 'mongoose'; 
import User from '../models/user.model';
import FamilyInvitation from '../models/familyInvitation.model';

import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, type AuthRequest } from '../middlewares/requireAuth';
 
const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const familyMembers = await User.find({
      _id: { $in: user.familyMembers || [] },
      select: 'name avatarUrl email',
    });
    
    const pendingInvitations = await FamilyInvitation.find({
      toUserId: userId,
      status: 'pending',
    }).populate('fromUserId', 'name avatarUrl');
    
    res.status(200).json({
      familyMembers,
      pendingInvitations: pendingInvitations.map(inv => ({
        id: inv._id,
        user: {
          id: (inv.fromUserId as any)._id,
          name: (inv.fromUserId as any).name,
          avatarUrl: (inv.fromUserId as any).avatarUrl,
        },
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/search', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    const query = req.query.q as string;
    
    if (!query || query.length < 2) {
      return res.status(200).json({ results: [] });
    }
    
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const searchResults = await User.find({
      _id: { $ne: userId },
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    })
    .select('name avatarUrl email')
    .limit(10);
    
    const existingMemberIds = currentUser.familyMembers || [];
    const filteredResults = searchResults.filter(
      user => !existingMemberIds.some(id => id.toString() === user._id.toString())
    );
    
    res.status(200).json({
      results: filteredResults.map(user => ({
        id: user._id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        username: `${user.name.toLowerCase().replace(/\s/g, '')}#${user._id.toString().slice(-4)}`,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/invite', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    const { targetUserId } = req.body;
    
    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' });
    }
    
    const inviter = await User.findById(userId);
    if (!inviter) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (inviter.subscriptionTier !== 'FAMILY') {
      return res.status(403).json({ error: 'Family subscription required' });
    }
    
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }
    
    const existingInvitation = await FamilyInvitation.findOne({
      fromUserId: userId,
      toUserId: targetUserId,
      status: 'pending',
    });
    
    if (existingInvitation) {
      return res.status(400).json({ error: 'Invitation already sent' });
    }
    
    await FamilyInvitation.create({
      fromUserId: userId,
      toUserId: targetUserId,
      status: 'pending',
    });
    
    res.status(201).json({ success: true, message: 'Invitation sent' });
  } catch (error) {
    next(error);
  }
});

router.post('/respond', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    const { invitationId, action } = req.body;
    
    if (!invitationId || !action) {
      return res.status(400).json({ error: 'invitationId and action are required' });
    }
    
    if (action !== 'accept' && action !== 'reject') {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    const invitation = await FamilyInvitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    
    if (invitation.toUserId.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    invitation.status = action === 'accept' ? 'accepted' : 'rejected';
    await invitation.save();
    
    if (action === 'accept') {
      const inviter = await User.findById(invitation.fromUserId);
      if (inviter) {
        inviter.familyMembers = inviter.familyMembers || [];
        inviter.familyMembers.push(new mongoose.Types.ObjectId(userId));
        await inviter.save();
      }
      
      const responder = await User.findById(userId);
      if (responder) {
        responder.familyMembers = responder.familyMembers || [];
        responder.familyMembers.push(invitation.fromUserId);
        await responder.save();
      }
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;