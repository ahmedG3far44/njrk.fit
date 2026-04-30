import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from './src/models/user.model';
import NutritionPlan from './src/models/nutrition.model';
import WeeklyFitnessPlan from './src/models/fitness.model';
import { generateMealPlan, generateWorkoutPlan } from './src/services/llm.service';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/njerka-fit';

async function testGeneration() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully.');

    // 1. Find or Create a Test User
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      testUser = await User.create({
        email: 'test@example.com',
        passwordHash: 'hashed_password_123',
        name: 'Test User',
        weight: 75,
        height: 180,
        age: 30,
        gender: 'male',
        activityLevel: 'moderate',
        goal: 'maintain_weight'
      });
      console.log('Created test user.');
    }

    const userContext = {
      name: testUser.name,
      weight: testUser.weight,
      height: testUser.height,
      age: testUser.age,
      gender: testUser.gender,
      activityLevel: testUser.activityLevel,
      goal: testUser.goal,
      fitnessGoals: [],
      dietaryRestrictions: []
    };

    // 2. Test Nutrition Generation
    console.log('\n--- Testing Nutrition Generation ---');
    try {
      const mealPlanData = await generateMealPlan(userContext as any);
      console.log('Successfully generated meal plan via LLM.');
      
      const nutritionPlan = await NutritionPlan.create({
        userId: testUser._id,
        date: new Date(),
        targetMacros: mealPlanData.targetMacros,
        meals: mealPlanData.meals
      });
      console.log(`Saved Nutrition Plan: ${nutritionPlan._id} with ${nutritionPlan.meals.length} meals.`);
    } catch (err) {
      console.error('Nutrition generation failed:', err);
    }

    // 3. Test Fitness Generation
    console.log('\n--- Testing Fitness Generation ---');
    try {
      const workoutPlanData = await generateWorkoutPlan(userContext as any, [], 60);
      console.log('Successfully generated workout plan via LLM.');
      
      const fitnessPlan = await WeeklyFitnessPlan.create({
        userId: testUser._id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sessionsCompleted: 0,
        sessions: workoutPlanData.sessions
      });
      console.log(`Saved Fitness Plan: ${fitnessPlan._id} with ${fitnessPlan.sessions.length} sessions.`);
    } catch (err) {
      console.error('Fitness generation failed:', err);
    }

    console.log('\nTest complete.');
  } catch (error) {
    console.error('Test script failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testGeneration();
