import { Post, Like, Comment } from '../models/community.model';

// 1. دالة جلب كل البوستات مع بيانات الكاتب (الاسم والإيميل والصورة)
export const getPosts = async (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    Post.find()
      .populate('userId', 'name email avatarUrl') // يجيب بيانات صاحب البوست من مودل الـ User
      .sort({ createdAt: -1 }) // ترتيب من الأحدث للأقدم
      .skip(skip)
      .limit(limit)
      .lean(),
    Post.countDocuments(),
  ]);

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

// 2. دالة الحذف (اللي سويناها أول)
export const deletePost = async (id: string) => {
  const post = await Post.findByIdAndDelete(id);
  if (!post) {
    return { success: false, message: 'post not found' };
  }

  await Promise.all([
    Like.deleteMany({ postId: id }),
    Comment.deleteMany({ postId: id }),
  ]);

  return { success: true, message: 'post deleted successfully along with all associated interactions' };
};