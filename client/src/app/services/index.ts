export { authService } from './authService';
export type { User, RegisterCredentials, LoginCredentials, AuthResponse, OnboardingData } from './authService';

export { userService } from './userService';
export type { UpdateProfileData, AvatarUploadResponse, DeleteAccountResponse } from './userService';

export { familyService } from './familyService';
export type { FamilyMember, PendingInvitation, FamilyResponse, SearchResult } from './familyService';

export { nutritionService } from './nutritionService';
export type { Meal, MealMacros, NutritionPlan, GenerateNutritionData, RefineMealData } from './nutritionService';

export { fitnessService } from './fitnessService';
export type { WorkoutSession, WorkoutPlan, GenerateFitnessData, CompleteSessionData } from './fitnessService';

export { groceryService } from './groceryService';
export type { GroceryItem, GroceryListResponse, SyncGroceryData, AddItemData } from './groceryService';

export { progressService } from './progressService';
export type { ProgressLog, WeightTrend, LogProgressData, FeelingLog } from './progressService';

export { scheduleService } from './scheduleService';
export type { ScheduleItem, ScheduleDetails, ScheduleResponse } from './scheduleService';

export { communityService } from './communityService';
export type { Post, Comment, CreatePostData, Pagination } from './communityService';

export { gamificationService } from './gamificationService';
export type { CheckInResponse, GamificationStatus, Reward } from './gamificationService';

export { subscriptionService } from './subscriptionService';
export type { CreateSubscriptionData, SubscriptionStatus } from './subscriptionService';