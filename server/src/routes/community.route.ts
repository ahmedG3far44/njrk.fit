import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { authMiddleware, type AuthRequest } from '../middlewares/authMiddleware';

import { Post, Like, Comment } from '../models/community.model';
// import { uploadFile } from '../configs/aws';
// import { v4 as uuidv4 } from 'uuid';

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

//upload.single('media')
// create post
router.post('/posts', authMiddleware, upload.single('media'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId;
        const mediaFile = req.file;
        const payload = req.body;
        console.log("payload", payload);
        const content = payload.content;

        if (!content) {
            return res.status(400).json({ error: "Content is required" });
        }

        console.log("content", content);
        console.log("mediaFile", mediaFile);

        let mediaUrl: string | undefined;

        mediaUrl = "https://imgs.search.brave.com/Rp_q1FGkE2mQ5yApmJ4NRgHo77BQ3eY0bLQYLGfdcrA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wbGFj/ZWhvbGRpdC5jb20v/NjAweDQwMA";

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

// get feed posts
// authMiddleware

router.get('/test', async (req: Request, res: Response, next: NextFunction) => {
    try {

        console.log("testing...");


        const data = [
            {
                "userId": "69eb84cf9f66ddaba8c9d37e",
                "content": "Laboriosam sint non in rerum consequatur a et. Qui perspiciatis omnis praesentium non molestiae eos et neque porro. Quia qui dicta velit. Dolorem quibusdam et aut amet culpa ipsam cum quis.",
                "mediaUrl": "https://imgs.search.brave.com/Rp_q1FGkE2mQ5yApmJ4NRgHo77BQ3eY0bLQYLGfdcrA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wbGFj/ZWhvbGRpdC5jb20v/NjAweDQwMA",
                "likeCount": 0,
                "commentCount": 0,
            },
            {
                "userId": "69eb84cf9f66ddaba8c9d37e",
                "content": "Cupiditate itaque in culpa modi eum nam delectus. Est et dolores nam. Autem occaecati voluptas. Est neque voluptas sequi ullam ut esse animi sequi. Est iure itaque sit. In quia quam eos repellat.",
                "mediaUrl": "https://imgs.search.brave.com/Rp_q1FGkE2mQ5yApmJ4NRgHo77BQ3eY0bLQYLGfdcrA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wbGFj/ZWhvbGRpdC5jb20v/NjAweDQwMA",
                "likeCount": 0,
                "commentCount": 0,
            },
            {
                "userId": "69eb84cf9f66ddaba8c9d37e",
                "content": "Ut occaecati vitae autem aspernatur. Ullam magnam dolor quia mollitia ipsa. Nihil blanditiis et consequatur. Eligendi inventore est blanditiis est adipisci voluptatem sint sed.",
                "mediaUrl": "https://imgs.search.brave.com/Rp_q1FGkE2mQ5yApmJ4NRgHo77BQ3eY0bLQYLGfdcrA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wbGFj/ZWhvbGRpdC5jb20v/NjAweDQwMA",
                "likeCount": 0,
                "commentCount": 0,
            },
            {
                "userId": "69eb84cf9f66ddaba8c9d37e",
                "content": "Est fuga rerum sint consectetur. Voluptatem a reiciendis nam est. Possimus aut in vitae reiciendis est necessitatibus provident. Mollitia dolores maiores sint consectetur delectus tempora aliquam rem numquam.",
                "mediaUrl": "https://imgs.search.brave.com/Rp_q1FGkE2mQ5yApmJ4NRgHo77BQ3eY0bLQYLGfdcrA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wbGFj/ZWhvbGRpdC5jb20v/NjAweDQwMA",
                "likeCount": 0,
                "commentCount": 0,
            },
            {
                "userId": "69eb84cf9f66ddaba8c9d37e",
                "content": "Sed deleniti laborum dolorem architecto in excepturi modi qui. Sit illo ut. Hic ipsum velit enim soluta. Consequatur consequatur excepturi cupiditate et magni non dignissimos. Modi sed mollitia nihil animi quibusdam et vel eum. Aut voluptas accusantium animi et magni est.",
                "mediaUrl": "https://imgs.search.brave.com/Rp_q1FGkE2mQ5yApmJ4NRgHo77BQ3eY0bLQYLGfdcrA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wbGFj/ZWhvbGRpdC5jb20v/NjAweDQwMA",
                "likeCount": 0,
                "commentCount": 0,
            },
            {
                "userId": "69eb84cf9f66ddaba8c9d37e",
                "content": "Dolore nulla ad perferendis. Odio quia sunt sit sit excepturi qui quia. Assumenda error qui aliquam ullam mollitia possimus autem sed aut. Dolorem ut voluptatem voluptas et voluptas totam doloribus molestiae voluptas. Iure cupiditate corrupti at rerum id quod et enim corporis. Non odio nesciunt architecto mollitia eos qui.",
                "mediaUrl": "https://imgs.search.brave.com/Rp_q1FGkE2mQ5yApmJ4NRgHo77BQ3eY0bLQYLGfdcrA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wbGFj/ZWhvbGRpdC5jb20v/NjAweDQwMA",
                "likeCount": 0,
                "commentCount": 0,
            },
            {
                "userId": "69eb84cf9f66ddaba8c9d37e",
                "content": "Perspiciatis autem odit temporibus ea perspiciatis. Ut et quae. Voluptatem aut dolores iusto. Dolorum aspernatur et officiis et autem cumque veniam velit in. Nobis omnis laudantium rem est.",
                "mediaUrl": "https://imgs.search.brave.com/Rp_q1FGkE2mQ5yApmJ4NRgHo77BQ3eY0bLQYLGfdcrA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wbGFj/ZWhvbGRpdC5jb20v/NjAweDQwMA",
                "likeCount": 0,
                "commentCount": 0,
            },
            {
                "userId": "69eb84cf9f66ddaba8c9d37e",
                "content": "Vel sunt quia. Voluptatem quaerat in molestias tempora placeat. Ipsum explicabo enim aliquid explicabo deleniti hic. Necessitatibus cupiditate provident sed. Laborum dolorum et error.",
                "mediaUrl": "https://imgs.search.brave.com/Rp_q1FGkE2mQ5yApmJ4NRgHo77BQ3eY0bLQYLGfdcrA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wbGFj/ZWhvbGRpdC5jb20v/NjAweDQwMA",
                "likeCount": 0,
                "commentCount": 0,
            },
            {
                "userId": "69eb84cf9f66ddaba8c9d37e",
                "content": "Saepe molestias adipisci reprehenderit rerum. Harum illum rerum esse tenetur. Quaerat iste ad nostrum est reiciendis sequi molestiae.",
                "mediaUrl": "https://imgs.search.brave.com/Rp_q1FGkE2mQ5yApmJ4NRgHo77BQ3eY0bLQYLGfdcrA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wbGFj/ZWhvbGRpdC5jb20v/NjAweDQwMA",
                "likeCount": 0,
                "commentCount": 0,
            },
            {

                "userId": "69eb84cf9f66ddaba8c9d37e",
                "content": "Voluptatum tempore aspernatur repellendus fugit fuga placeat. Quidem omnis reiciendis. Sit ut provident molestias est illum omnis ipsa quis rerum. Ea voluptatem rerum unde doloremque odit. Nam eaque repellat culpa est. Voluptates nisi sed unde pariatur placeat cumque inventore odit consequuntur.",
                "mediaUrl": "https://imgs.search.brave.com/Rp_q1FGkE2mQ5yApmJ4NRgHo77BQ3eY0bLQYLGfdcrA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wbGFj/ZWhvbGRpdC5jb20v/NjAweDQwMA",
                "likeCount": 0,
                "commentCount": 0,
            },
            {
                "userId": "69eb84cf9f66ddaba8c9d37e",
                "content": "Dolor corrupti natus. Commodi aut cum voluptatem dolorem esse. Et omnis vel est et. Qui tempora adipisci.",
                "mediaUrl": "https://imgs.search.brave.com/Rp_q1FGkE2mQ5yApmJ4NRgHo77BQ3eY0bLQYLGfdcrA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wbGFj/ZWhvbGRpdC5jb20v/NjAweDQwMA",
                "likeCount": 0,
                "commentCount": 0,
            }
        ]


        // const count = await Post.countDocuments();

        // if (count === 0) {
        //     await Post.insertMany(data);
        //     console.log('Seeded posts');
        // }

        // // const posts = await Post.find()

        // // console.log("posts", posts);

        res.status(200).json({ success: true, data: data });
    }
    catch (e) {
        console.log("error", e);
        res.status(500).json({ success: false, message: (e as Error).message });
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

// Unlike post 
// router.delete("/posts/:id/like", authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const authReq = req as AuthRequest;
//         const userId = new mongoose.Types.ObjectId(authReq.user?.userId);
//         const postId = new mongoose.Types.ObjectId(req.params.id as string);
//         const post = await Post.findById(postId);
//         const existingLike = await Like.findOne({ postId, userId });

//         if (!existingLike) {
//             return res.status(400).json({ error: 'You have not liked this post' });
//         }

//         if (!post) {
//             return res.status(404).json({ error: 'Post not found' });
//         }

//         await existingLike.deleteOne();

//         post.likeCount -= 1;
//         await post.save();

//         res.status(200).json({ success: true });
//     } catch (error) {
//         next(error);
//     }
// });


// get comments by post id
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