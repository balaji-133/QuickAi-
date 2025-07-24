import { Hash, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Markdown from 'react-markdown';
import ErrorBoundary from '../components/ErrorBoundary'; // adjust path if needed
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';

// Set global base URL
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const BlogTitles = () => {
  const blogCategories = [
    'General', 'Project name', 'Movie Title', 'Hackathon team name', 'Technology',
    'Business', 'Health', 'Lifestyle', 'Education', 'Travel', 'Food', 'Fashion',
    'Sports', 'Entertainment'
  ];

  const [selectedCategory, setSelectedCategory] = useState('General');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');

  const { getToken } = useAuth();

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = await getToken();
      const prompt = `Generate top 10 blog titles for the keyword "${input}" in the category "${selectedCategory}"`;

      const { data } = await axios.post(
        '/api/ai/blog-title',
        { prompt },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success && typeof data.content === 'string') {
        setContent(data.content); // ✅ Set content correctly
      } else {
        toast.error(data.message || 'No content generated.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">
      {/* Left Column: Input form */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 text-[#8E37EB]" />
          <h1 className="text-xl font-semibold">AI Title Generator</h1>
        </div>

        <p className="mt-6 text-sm font-medium">Keyword</p>
        <input
          onChange={(e) => setInput(e.target.value)}
          value={input}
          type="text"
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300"
          placeholder="e.g. The future of AI"
          required
        />

        <p className="mt-4 text-sm font-medium">Category</p>
        <div className="mt-3 flex gap-3 flex-wrap sm:max-w-9/11">
          {blogCategories.map((item) => (
            <span
              key={item}
              onClick={() => setSelectedCategory(item)}
              className={`text-xs px-4 py-1 border rounded-full cursor-pointer ${
                selectedCategory === item
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-500 border-gray-500'
              }`}
            >
              {item}
            </span>
          ))}
        </div>

        <br />
        <button
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#C341F6] to-[#8E37EB] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" />
          ) : (
            <Hash className="w-5" />
          )}
          Generate Title
        </button>
      </form>

      {/* Right Column: Output Preview */}
      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96">
        <div className="flex items-center gap-3">
          <Hash className="w-5 h-5 text-[#8E37EB]" />
          <h1 className="text-xl font-semibold">Generated Titles</h1>
        </div>

        {!loading && !content && (
          <div className="flex-1 flex justify-center items-center">
            <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
              <Hash className="w-9 h-9" />
              <p>Enter a topic and click "Generate Title" to get started</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex-1 flex justify-center items-center text-sm text-gray-400">
            🔮 Generating blog titles...
          </div>
        )}

        {!loading && content && (
          <div className="mt-3 h-full overflow-y-scroll text-sm text-slate-600">
            <ErrorBoundary>
              <div className="reset-tw">
                {/* If titles are markdown-formatted, keep Markdown */}
                <Markdown>{content}</Markdown>
              </div>
            </ErrorBoundary>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogTitles;
