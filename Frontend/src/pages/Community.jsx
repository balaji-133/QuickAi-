import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Heart } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const Community = () => {
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const { getToken } = useAuth();

  const fetchCreations = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get('/api/user/community', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setCreations(data.creations);
      } else {
        toast.error(data.message || 'Failed to fetch creations');
      }
    } catch (err) {
      toast.error(err.message || 'Error fetching creations');
    } finally {
      setLoading(false);
    }
  };

  const imageLikeToggle = async (id) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        '/api/user/toggle-like-creation',
        { id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        toast.success(data.message);
        await fetchCreations(); // Refresh list after toggle
      } else {
        toast.error(data.message || 'Failed to toggle like');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to toggle like');
    }
  };

  useEffect(() => {
    if (user) fetchCreations();
  }, [user]);

  return !loading ? (
    <div className="flex-1 h-full flex flex-col gap-4 p-6">
      <h2 className="text-xl font-bold mb-2">Creations</h2>
      <div className="bg-white h-full w-full rounded-xl overflow-y-scroll">
        <div className="flex flex-wrap gap-4 p-4">
          {creations.length === 0 ? (
            <p className="text-gray-500">No creations found.</p>
          ) : (
            creations.map((creation) => (
              <div
                key={creation.id}
                className="relative group w-full sm:max-w-[48%] lg:max-w-[32%] aspect-[4/5] bg-gray-100 rounded-xl overflow-hidden"
              >
                <img
                  src={creation.content}
                  alt="creation"
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-b from-transparent to-black/80 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-sm text-white mb-2 hidden group-hover:block">
                    {creation.prompt}
                  </p>
                  <div className="flex items-center gap-1 text-white">
                    <p>{creation.likes.length}</p>
                    <Heart
                      onClick={() => imageLikeToggle(creation.id)}
                      className={`min-w-5 h-5 hover:scale-110 cursor-pointer transition-transform ${
                        creation.likes.includes(user.id)
                          ? 'fill-red-500 text-red-600'
                          : 'text-white'
                      }`}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  ) : (
    <div className="flex justify-center items-center h-full">
      <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin border-gray-500" />
    </div>
  );
};

export default Community;
