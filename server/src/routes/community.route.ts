import mongoose from 'mongoose';

import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, type AuthRequest } from '../middlewares/authMiddleware';

import { Post, Like, Comment } from '../models/community.model';
import { uploadToCloudinary } from '../services/upload.service';
import { upload } from '../configs/multer';


const router = Router();

router.post('/posts', authMiddleware, upload.single('media'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId;
        const mediaFile = req.file;
        const payload = req.body;
        const content = payload.content;


        if (!content) {
            return res.status(400).json({ error: "Content is required" });
        }

        let mediaUrl: string | undefined;

        if (mediaFile) {
            const key = `/njerka/community/posts`;
            const { secure_url } = await uploadToCloudinary(
                mediaFile.buffer,
                key
            );
            mediaUrl = secure_url;
        }

        console.log(mediaUrl)

        const post = await Post.create({
            userId,
            content,
            mediaUrl,
            likeCount: 0,
            commentCount: 0,
        });

        res.status(201).json({ post });
    } catch (error) {
        next(error);
    }
});



router.get('/feed', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = new mongoose.Types.ObjectId(authReq.user?.userId);
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'name avatarUrl');

        const total = await Post.countDocuments();

        const userLikes = await Like.find({ userId }).select('postId');
        const likedPostIds = new Set(userLikes.map(l => l.postId.toString()));

        const postsWithLikeStatus = posts.map(post => ({
            ...post.toObject(),
            isLiked: likedPostIds.has(post._id.toString()),
        }));

        res.status(200).json({
            posts: postsWithLikeStatus,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        next(error);
    }
});

//delete posts
router.delete("/posts/:id", authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const postId = new mongoose.Types.ObjectId(req.params.id as string);
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        await Post.deleteOne({ _id: postId });
        res.status(200).json({ success: true });
    } catch (error) {
        next(error);
    }
});

// Toggle Likes on a Post
router.put('/posts/:id/like', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId as string;
        const postId = req.params.id as string;
        const post = await Post.findById(postId);
        const existingLike = await Like.findOne({ postId, userId });
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        //unlike post
        if (existingLike) {
            await Like.deleteOne({ postId, userId });
            post.likeCount -= 1;
            post.isLiked = false;
            await post.save();

            res.status(200).json({ success: true, message: "Post unliked successfully", count: post.likeCount });
        }

        //like post
        const like = await Like.create({
            postId: postId,
            userId: userId,
        });

        post.likeCount += 1;
        post.isLiked = true;
        await post.save();

        res.status(201).json({ success: true, message: "Post liked successfully", count: post.likeCount });
    } catch (error) {
        next(error);
    }
});


router.get('/posts/:id/comments', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const postId = new mongoose.Types.ObjectId(req.params.id as string);

        const comments = await Comment.find({ postId: postId })
            .sort({ createdAt: -1 })
            .populate('userId', 'name avatarUrl');

        res.status(200).json({ comments });
    } catch (error) {
        next(error);
    }
});

// create comment
router.post('/posts/:id/comment', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = new mongoose.Types.ObjectId(authReq.user?.userId);

        const postId = new mongoose.Types.ObjectId(req.params.id as string);
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const comment = await Comment.create({
            postId: postId,
            userId: userId,
            content: req.body.content,
        });

        post.commentCount += 1;
        await post.save();

        res.status(201).json({ comment });
    } catch (error) {
        next(error);
    }
});

// delete comment
router.delete("/posts/:id/comment/:commentId", authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = new mongoose.Types.ObjectId(authReq.user?.userId);

        const postId = new mongoose.Types.ObjectId(req.params.id as string);
        const commentId = new mongoose.Types.ObjectId(req.params.commentId as string);

        const post = await Post.findById(postId);
        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.userId.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'You are not authorized to delete this comment' });
        }

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        await comment.deleteOne();

        post.commentCount -= 1;
        await post.save();

        res.status(200).json({ comment });
    } catch (error) {
        next(error);
    }
});

export default router;