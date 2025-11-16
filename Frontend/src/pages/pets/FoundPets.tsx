import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ArrowLeft, Heart, Sparkles, ShieldCheck, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PetGallery } from '@/components/pets/PetGallery';
import { petsAPI, chatAPI } from '@/services/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export default function FoundPets() {
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
      const data = await petsAPI.getAll({ 
        report_type: 'found',
        status: 'Listed Found' 
      });
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

  const handleClaimPet = async (pet: any) => {
    if (!isAuthenticated) {
      toast({
        title: 'Please sign in',
        description: 'You need to be logged in to claim a pet',
      });
      navigate('/auth/login');
      return;
    }

    try {
      const { roomId } = await chatAPI.createRoom(pet.id, 'current-user-id');
      toast({
        title: 'Chat room created',
        description: 'You can now communicate with the rescuer and admin',
      });
      navigate(`/chat/${roomId}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not create chat room',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
      {/* Hero Section - No Image */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-700">
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
                    Found Pets
                  </h1>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-green-200" />
                    <p className="text-lg sm:text-xl text-green-50 max-w-2xl">
                      Browse pets that have been found and are waiting to be reunited with their families
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex flex-wrap items-center gap-6 mt-8">
                <div className="flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                  <ShieldCheck className="h-5 w-5 text-green-200" />
                  <span className="text-sm font-semibold">NGO Verified</span>
                </div>
                <div className="flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                  <span className="text-2xl font-bold">{pets.length}</span>
                  <span className="text-sm ml-1">Active Reports</span>
                </div>
              </div>
            </div>
            
            <Button 
              size="lg"
              className="bg-white text-green-700 hover:bg-green-50 shadow-2xl hover:shadow-green-500/20 border-2 border-white/50 font-semibold px-8 py-6 text-lg h-auto whitespace-nowrap"
              onClick={() => navigate('/pets/new/found')}
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Report Found Pet
            </Button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Gallery */}
        <PetGallery
          pets={pets}
          loading={loading}
          onActionClick={handleClaimPet}
          actionLabel="This is my pet!"
          theme="green"
        />
      </div>
    </div>
  );
}
