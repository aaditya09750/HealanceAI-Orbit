import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Technology',
        'Wellness',
        'Prevention',
        'Lifestyle',
        'Nutrition',
        'Mental Health',
        'Platform Guide',
        'Product Update',
      ],
    },
    image: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      required: true,
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      name: { type: String, required: true },
      avatar: String,
      designation: String,
    },
    tags: [String],
    readTime: String,
    isPublished: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Auto-generate slug from title
blogSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\s+/g, '-');
  }
  // Calculate read time (~200 words per minute)
  if (this.content) {
    const wordCount = this.content.split(/\s+/).length;
    this.readTime = `${Math.ceil(wordCount / 200)} min read`;
  }
  next();
});

blogSchema.index({ category: 1, isPublished: 1 });

const Blog = mongoose.model('Blog', blogSchema);
export default Blog;
