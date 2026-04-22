import React, { useState } from 'react';
import { Search, Filter, Clock, ArrowRight, TrendingUp, Bookmark } from 'lucide-react';
import Button from '../../shared/ui/Button';
import EmptyState from '../../shared/ui/EmptyState';
import DashReveal from '../../shared/ui/DashReveal';

const blogPosts = [
  {
    id: 1,
    title: 'Understanding Your AI Health Score',
    category: 'Platform Guide',
    image:
      'https://images.pexels.com/photos/8439093/pexels-photo-8439093.jpeg?auto=compress&cs=tinysrgb&w=800',
    excerpt:
      'Learn how our algorithms calculate your daily health metrics and what they mean for your longevity.',
    readTime: '5 min read',
    isPopular: true,
  },
  {
    id: 2,
    title: '5 Foods to Boost Heart Health',
    category: 'Nutrition',
    image:
      'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
    excerpt:
      'Cardiologist-approved superfoods that you should include in your diet starting today.',
    readTime: '3 min read',
    isPopular: false,
  },
  {
    id: 3,
    title: 'The Science of Sleep Cycles',
    category: 'Wellness',
    image:
      'https://images.pexels.com/photos/3771069/pexels-photo-3771069.jpeg?auto=compress&cs=tinysrgb&w=800',
    excerpt:
      'Why deep sleep matters more than duration, and how to optimize your bedroom for rest.',
    readTime: '7 min read',
    isPopular: true,
  },
  {
    id: 4,
    title: 'Managing Stress with Mindfulness',
    category: 'Mental Health',
    image:
      'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=800',
    excerpt:
      'Simple breathing exercises you can do at your desk to lower cortisol levels instantly.',
    readTime: '4 min read',
    isPopular: false,
  },
  {
    id: 5,
    title: 'New Feature: Body Explorer',
    category: 'Product Update',
    image:
      'https://images.pexels.com/photos/7089401/pexels-photo-7089401.jpeg?auto=compress&cs=tinysrgb&w=800',
    excerpt: 'Explore our new interactive 3D body map to understand your symptoms better.',
    readTime: '2 min read',
    isPopular: false,
  },
  {
    id: 6,
    title: 'Walking Your Way to Better Health',
    category: 'Fitness',
    image:
      'https://images.pexels.com/photos/4149027/pexels-photo-4149027.jpeg?auto=compress&cs=tinysrgb&w=800',
    excerpt: 'Discover why 10,000 steps a day can transform your cardiovascular health.',
    readTime: '4 min read',
    isPopular: true,
  },
  {
    id: 7,
    title: 'Hydration: The Overlooked Essential',
    category: 'Wellness',
    image:
      'https://images.pexels.com/photos/1458671/pexels-photo-1458671.jpeg?auto=compress&cs=tinysrgb&w=800',
    excerpt: 'How proper hydration affects energy, focus, and overall body function.',
    readTime: '3 min read',
    isPopular: false,
  },
  {
    id: 8,
    title: 'Building Immunity Naturally',
    category: 'Nutrition',
    image:
      'https://images.pexels.com/photos/5945848/pexels-photo-5945848.jpeg?auto=compress&cs=tinysrgb&w=800',
    excerpt: 'Foods and habits that strengthen your immune system for year-round health.',
    readTime: '5 min read',
    isPopular: true,
  },
];

const categories = [
  'All',
  'Platform Guide',
  'Nutrition',
  'Wellness',
  'Mental Health',
  'Product Update',
  'Fitness',
];

const DashboardBlogs = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6a7283]" size={18} />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dash-input !pl-10 w-full sm:w-64"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6a7283]" size={18} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="dash-input !pl-10 !pr-8 appearance-none w-full sm:w-auto cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <DashReveal className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Main Content Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {filteredPosts.length === 0 ? (
            <div className="sm:col-span-2">
              <EmptyState
                icon={Search}
                title="No articles found"
                description={`No results for "${searchQuery}" in ${selectedCategory}`}
                action={{
                  label: 'Clear filters',
                  onClick: () => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  },
                }}
              />
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div
                key={post.id}
                className="dash-card dash-card-glow overflow-hidden group flex flex-col h-full !p-0"
              >
                <div className="relative h-40 sm:h-48 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span
                    className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold text-white"
                    style={{
                      background: 'linear-gradient(135deg, #506cd7 0%, #0ea5e9 100%)',
                      boxShadow: '0 4px 12px rgba(80, 108, 215, 0.28)',
                    }}
                  >
                    {post.category}
                  </span>
                  {post.isPopular && (
                    <span
                      className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' }}
                    >
                      Trending
                    </span>
                  )}
                </div>
                <div className="p-4 sm:p-5 flex-1 flex flex-col">
                  <h3 className="text-base sm:text-lg font-bold text-[#0b1030] mb-2 line-clamp-2 group-hover:text-[#506cd7] transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5f697a] mb-3 sm:mb-4 line-clamp-3 flex-1">
                    {post.excerpt}
                  </p>
                  <div className="flex justify-between items-center pt-3 sm:pt-4 border-t border-[#f0f1fc] mt-auto">
                    <span className="text-[10px] sm:text-xs text-[#6a7283] flex items-center">
                      <Clock size={12} className="mr-1" /> {post.readTime}
                    </span>
                    <button className="text-xs sm:text-sm font-semibold text-[#506cd7] hover:text-[#4753bf] flex items-center">
                      Read <ArrowRight size={14} className="ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          <div
            className="dash-card-static dash-card-accent"
            style={{ '--accent-stripe': '#f59e0b' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="dash-icon-badge dash-icon-badge--gradient-amber">
                <TrendingUp size={20} className="text-white" />
              </div>
              <h3 className="dash-heading text-sm sm:text-base">Trending Now</h3>
            </div>
            <div className="space-y-4">
              {blogPosts
                .filter((p) => p.isPopular)
                .map((post) => (
                  <div key={post.id} className="flex gap-3 group cursor-pointer">
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={post.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#0b1030] line-clamp-2 group-hover:text-[#506cd7] transition-colors">
                        {post.title}
                      </h4>
                      <span className="text-xs text-[#5f697a] mt-1 block">{post.readTime}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div
            className="p-6 rounded-[20px] text-white relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #506cd7 0%, #4753bf 50%, #0ea5e9 100%)',
              boxShadow: '0 14px 40px rgba(80, 108, 215, 0.35)',
            }}
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <div className="dash-icon-badge bg-white/20 backdrop-blur mb-4">
                <Bookmark size={20} className="text-white" />
              </div>
              <h3 className="font-heading font-bold text-lg mb-2">Saved Articles</h3>
              <p className="text-white/80 text-sm mb-4">
                You haven't saved any articles yet. Bookmark posts to read them later.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full !text-white !border-white/40 hover:!bg-white/10"
              >
                View Bookmarks
              </Button>
            </div>
          </div>
        </div>
      </DashReveal>
    </div>
  );
};

export default DashboardBlogs;
