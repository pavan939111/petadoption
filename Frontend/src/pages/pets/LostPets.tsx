import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ArrowLeft, Search, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PetGallery } from '@/components/pets/PetGallery';
import { petsAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function LostPets() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      setLoading(true);
      const data = await petsAPI.getAll({ 
        report_type: 'lost',
        status: 'Listed Lost' 
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
      {/* Hero Section - No Image */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700">
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
                  <Search className="h-9 w-9 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 drop-shadow-lg">
                    Lost Pets
                  </h1>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-orange-200" />
                    <p className="text-lg sm:text-xl text-orange-50 max-w-2xl">
                      Help find these lost pets and reunite them with their worried families
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex flex-wrap items-center gap-6 mt-8">
                <div className="flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                  <ShieldCheck className="h-5 w-5 text-orange-200" />
                  <span className="text-sm font-semibold">NGO Verified</span>
                </div>
                <div className="flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                  <span className="text-2xl font-bold">{pets.length}</span>
                  <span className="text-sm ml-1">Active Reports</span>
                </div>
                <div className="flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                  <AlertCircle className="h-5 w-5 text-orange-200" />
                  <span className="text-sm font-semibold">Urgent Search</span>
                </div>
              </div>
            </div>
            
            <Button 
              size="lg"
              className="bg-white text-orange-700 hover:bg-orange-50 shadow-2xl hover:shadow-orange-500/20 border-2 border-white/50 font-semibold px-8 py-6 text-lg h-auto whitespace-nowrap"
              onClick={() => navigate('/pets/new/lost')}
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Report Lost Pet
            </Button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Gallery */}
        <PetGallery pets={pets} loading={loading} theme="orange" />
      </div>
    </div>
  );
}
