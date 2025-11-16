import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Sparkles, ShieldCheck, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PetGallery } from '@/components/pets/PetGallery';
import { petsAPI } from '@/services/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export default function AdoptablePets() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      setLoading(true);
      const data = await petsAPI.getAll({ status: 'Available for Adoption' });
      setPets(data.items || []);
    } catch (error) {
      toast({
        title: 'Error loading pets',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (pet: any) => {
    if (!isAuthenticated) {
      toast({
        title: 'Please sign in',
        description: 'You need to be logged in to apply for adoption',
      });
      navigate('/auth/login');
      return;
    }
    navigate(`/pets/${pet.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30">
      {/* Hero Section - No Image */}
      <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/home')} 
            className="mb-8 text-white/90 hover:text-white hover:bg-white/20 backdrop-blur-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/30 shadow-lg">
                  <Heart className="h-9 w-9 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 drop-shadow-lg">
                    Pets Available for Adoption
                  </h1>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-pink-200" />
                    <p className="text-lg sm:text-xl text-pink-50 max-w-2xl">
                      Give these wonderful pets a loving forever home
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex flex-wrap items-center gap-6 mt-8">
                <div className="flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                  <ShieldCheck className="h-5 w-5 text-pink-200" />
                  <span className="text-sm font-semibold">NGO Verified</span>
                </div>
                <div className="flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                  <PawPrint className="h-5 w-5 text-pink-200" />
                  <span className="text-sm font-semibold">Forever Homes</span>
                </div>
                <div className="flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                  <span className="text-2xl font-bold">{pets.length}</span>
                  <span className="text-sm ml-1">Available Pets</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Info Card */}
        <div className="mb-8 rounded-2xl border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50 p-6 lg:p-8 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center flex-shrink-0">
              <PawPrint className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to adopt?</h3>
              <p className="text-base text-gray-700 leading-relaxed">
                All applications are reviewed by our team. We may request ID, references, and a home check to ensure 
                the best match for each pet. These animals are looking for their forever families.
              </p>
            </div>
          </div>
        </div>

        {/* Gallery */}
        <PetGallery
          pets={pets}
          loading={loading}
          onActionClick={handleApply}
          actionLabel="Apply to Adopt"
        />
      </div>
    </div>
  );
}
