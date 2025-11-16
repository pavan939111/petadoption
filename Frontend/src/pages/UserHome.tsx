import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, Search, Heart, FileText, TrendingUp, ArrowRight, ShieldCheck, Users, Sparkles, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { petsAPI } from '@/services/api';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function UserHome() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [myPets, setMyPets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Redirect unauthenticated users to landing page
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    // Redirect admin users to admin panel
    if (isAdmin) {
      navigate('/admin');
      return;
    }
  }, [isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated, user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const { items } = await petsAPI.getAll();
      // Filter pets submitted by current user
      // Handle both object and string formats for submitted_by
      const userPets = items.filter((p: any) => {
        const submittedById = typeof p.submitted_by === 'object' 
          ? (p.submitted_by._id || p.submitted_by.id)
          : p.submitted_by;
        const userId = user?._id || user?.id;
        return submittedById && userId && String(submittedById) === String(userId);
      });
      // Sort by date_submitted (most recent first)
      userPets.sort((a: any, b: any) => {
        const dateA = new Date(a.date_submitted || a.createdAt || 0).getTime();
        const dateB = new Date(b.date_submitted || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      setMyPets(userPets);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast({
        title: 'Error',
        description: 'Could not load your pet reports',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Report Found Pet',
      description: 'Found a pet? Help reunite it with its family',
      icon: Heart,
      href: '/pets/new/found',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
    },
    {
      title: 'Report Lost Pet',
      description: 'Lost your pet? Get instant matches',
      icon: Search,
      href: '/pets/new/lost',
      color: 'from-orange-500 to-amber-600',
      bgColor: 'from-orange-50 to-amber-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200',
    },
    {
      title: 'Adopt a Pet',
      description: 'Find your perfect companion',
      icon: Heart,
      href: '/pets/adopt',
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center animate-pulse">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <p className="text-lg font-semibold text-gray-700">Loading your dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Welcome Header */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 sm:p-10 shadow-xl relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 h-32 w-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="absolute bottom-0 left-0 h-24 w-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-2xl" />
            
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                      Welcome back, {user?.name}! 👋
                    </h1>
                    <p className="mt-2 text-lg sm:text-xl text-orange-50">
                      Here's what's happening with your pet reports
                    </p>
                  </div>
                </div>
              </div>
              <div className="hidden sm:flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
        </div>


        {/* Quick Actions */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Quick Actions</h2>
            <div className="h-1 flex-1 bg-gradient-to-r from-orange-500 to-transparent rounded-full" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {quickActions.map((action) => (
              <Link key={action.title} to={action.href}>
                <Card className={`group h-full border-2 ${action.borderColor} cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 bg-white`}>
                  <CardHeader className="pb-4">
                    <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br ${action.color} shadow-lg group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 mb-2">{action.title}</CardTitle>
                    <CardDescription className="text-sm text-gray-600 leading-relaxed">{action.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className={`flex items-center text-sm font-semibold ${action.iconColor} group-hover:gap-2 transition-all`}>
                      Get Started <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Reports */}
        <div>
          <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full" />
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Recent Reports</h2>
              </div>
              <p className="text-sm sm:text-base text-gray-600 ml-0 sm:ml-16">Track and manage your pet submissions</p>
            </div>
            {myPets.length > 5 && (
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg" asChild>
                <Link to="/profile">
                  View All ({myPets.length})
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>

          {myPets.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-200 bg-gradient-to-br from-white to-gray-50">
              <CardContent className="py-16 text-center">
                <div className="flex justify-center mb-6">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center border-2 border-orange-200">
                    <FileText className="h-10 w-10 text-orange-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No reports yet</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto text-base">
                  Start helping pets and their families by reporting found or lost pets in your area
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg">
                    <Link to="/pets/new/found">
                      <Heart className="mr-2 h-5 w-5" />
                      Report Found Pet
                    </Link>
                  </Button>
                  <Button variant="outline" asChild size="lg" className="border-2 border-orange-200 hover:bg-orange-50">
                    <Link to="/pets/new/lost">
                      <Search className="mr-2 h-5 w-5" />
                      Report Lost Pet
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myPets.slice(0, 5).map((pet: any) => {
                const photoUrl = Array.isArray(pet.photos) && pet.photos.length > 0
                  ? (typeof pet.photos[0] === 'string' ? pet.photos[0] : pet.photos[0].url)
                  : 'https://via.placeholder.com/80';
                const isFound = pet.status === 'Listed Found';
                const isLost = pet.status === 'Listed Lost';
                return (
                <Card key={pet.id || pet._id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-gray-100 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      {/* Pet Image */}
                      <div className="flex-shrink-0 relative">
                        <img
                          src={photoUrl}
                          alt={pet.breed || 'Pet'}
                          className="h-24 w-24 rounded-xl object-cover border-2 border-gray-200 shadow-md"
                        />
                        <div className={`absolute -top-2 -right-2 h-6 w-6 rounded-full ${isFound ? 'bg-green-500' : isLost ? 'bg-orange-500' : 'bg-gray-400'} border-2 border-white flex items-center justify-center`}>
                          {isFound ? <CheckCircle2 className="h-3 w-3 text-white" /> : 
                           isLost ? <Search className="h-3 w-3 text-white" /> : 
                           <Clock className="h-3 w-3 text-white" />}
                        </div>
                      </div>

                      {/* Pet Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900 truncate">{pet.breed || 'Unknown Breed'}</h3>
                          <Badge 
                            className={`text-xs font-semibold ${
                              isFound ? 'bg-green-100 text-green-700 border-green-200' :
                              isLost ? 'bg-orange-100 text-orange-700 border-orange-200' :
                              'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            {pet.status || 'Unknown'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{pet.location || 'Location not specified'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>Submitted {format(new Date(pet.date_submitted || new Date()), 'MMM d, yyyy')}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0">
                        <Button variant="outline" size="sm" className="border-2 hover:bg-orange-50 hover:border-orange-200" asChild>
                          <Link to={`/pets/${pet.id || pet._id}`}>
                            View Details
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}

              {/* View All Button at Bottom */}
              {myPets.length > 5 && (
                <div className="pt-6 text-center">
                  <Button size="lg" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg" asChild>
                    <Link to="/profile">
                      View All {myPets.length} Reports
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-12 bg-gradient-to-br from-orange-50 to-rose-50 rounded-2xl p-8 border-2 border-orange-100 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">💡 Need Help?</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                Check out our safety guidelines and policies to ensure your pet reports are effective and help reunite families faster.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="border-2 hover:bg-white hover:border-orange-200" asChild>
                  <Link to="/safety">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Safety Guidelines
                  </Link>
                </Button>
                <Button variant="outline" className="border-2 hover:bg-white hover:border-orange-200" asChild>
                  <Link to="/policy">
                    <FileText className="mr-2 h-4 w-4" />
                    Privacy Policy
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
