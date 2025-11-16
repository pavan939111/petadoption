import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, ArrowLeft, Heart, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { petsAPI, uploadsAPI } from '@/services/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

const foundPetSchema = z.object({
  species: z.string().min(1, 'Please select a species'),
  breed: z.string().min(2, 'Please enter the breed'),
  color: z.string().min(2, 'Please describe the color'),
  sex: z.string().min(1, 'Please select sex'),
  distinguishing_marks: z.string().min(10, 'Please provide detailed description'),
  location_found: z.string().min(3, 'Please enter the location'),
  date_found: z.string().min(1, 'Please select the date'),
});

type FoundPetForm = z.infer<typeof foundPetSchema>;

export default function ReportFound() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FoundPetForm>({
    resolver: zodResolver(foundPetSchema),
  });

  const species = watch('species');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  const onSubmit = async (data: FoundPetForm) => {
    if (!isAuthenticated) {
      toast({
        title: 'Please sign in',
        description: 'You need to be logged in to report a found pet',
      });
      navigate('/auth/login');
      return;
    }

    if (photos.length === 0) {
      toast({
        title: 'Photos required',
        description: 'Please upload at least one photo',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Create pet report with files directly
      await petsAPI.create({
        report_type: 'found',
        species: data.species,
        breed: data.breed,
        sex: data.sex || 'Unknown',
        color_primary: data.color,
        distinguishing_marks: data.distinguishing_marks,
        last_seen_or_found_location_text: data.location_found,
        last_seen_or_found_date: data.date_found,
        contact_preference: 'Email',
        allow_public_listing: true,
        photos: photos, // Send File objects directly
      });

      toast({
        title: 'Report submitted!',
        description: 'Your found pet report is pending admin verification.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      // Display validation errors in a more user-friendly way
      const errorMessage = error.message || 'Could not submit report. Please try again.';
      
      // If it's a validation error with multiple fields, show them in a list
      if (errorMessage.includes('Validation failed:')) {
        const errorLines = errorMessage.split('\n').slice(1); // Skip "Validation failed:" line
        const errorList = errorLines.join('\n• ');
        toast({
          title: 'Validation Failed',
          description: `Please fix the following errors:\n• ${errorList}`,
          variant: 'destructive',
          duration: 10000,
        });
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
      {/* Compact Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            className="mb-6 text-white/90 hover:text-white hover:bg-white/20 backdrop-blur-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
            {/* Left Side - Content */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/30">
                  <Heart className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                    Report a Found Pet
                  </h1>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-green-200" />
                    <p className="text-base sm:text-lg text-green-50">
                      Help reunite this pet with their family
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Info Points */}
              <div className="flex flex-wrap items-center gap-4 mt-6">
                <div className="flex items-center gap-2 text-white/90">
                  <ShieldCheck className="h-5 w-5 text-green-200" />
                  <span className="text-sm font-medium">NGO Verified</span>
                </div>
                <div className="h-4 w-px bg-white/30" />
                <div className="flex items-center gap-2 text-white/90">
                  <CheckCircle2 className="h-5 w-5 text-green-200" />
                  <span className="text-sm font-medium">Quick Processing</span>
                </div>
              </div>
            </div>
            
            {/* Right Side - Image */}
            <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/30">
                <img
                  src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&q=80"
                  alt="Found pet illustration"
                  className="w-full h-64 lg:h-72 object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-green-900/40 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <Card className="shadow-2xl border-2 border-gray-200 bg-white rounded-2xl">
          <CardHeader className="pt-8 pb-6 px-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-1 w-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full" />
              <CardTitle className="text-3xl font-bold text-gray-900">Pet Details</CardTitle>
            </div>
            <CardDescription className="text-base mt-2 text-gray-600">
              Please provide as much information as possible to help identify the pet and reunite them with their family
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-8 px-8 pb-8">
              {/* First Row - Species and Breed */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Species */}
                <div className="space-y-2">
                  <Label htmlFor="species" className="text-sm font-semibold">Species *</Label>
                  <Select value={species} onValueChange={(value) => setValue('species', value)}>
                    <SelectTrigger id="species" className="h-11">
                      <SelectValue placeholder="Select species" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dog">Dog</SelectItem>
                      <SelectItem value="Cat">Cat</SelectItem>
                      <SelectItem value="Cow">Cow</SelectItem>
                      <SelectItem value="Camel">Camel</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.species && (
                    <p className="text-sm text-destructive mt-1">{errors.species.message}</p>
                  )}
                </div>

                {/* Breed */}
                <div className="space-y-2">
                  <Label htmlFor="breed" className="text-sm font-semibold">Breed *</Label>
                  <Input
                    id="breed"
                    placeholder="e.g., Golden Retriever, Mixed Breed"
                    className="h-11"
                    {...register('breed')}
                  />
                  {errors.breed && (
                    <p className="text-sm text-destructive mt-1">{errors.breed.message}</p>
                  )}
                </div>
              </div>

              {/* Second Row - Sex and Color */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sex */}
                <div className="space-y-2">
                  <Label htmlFor="sex" className="text-sm font-semibold">Sex *</Label>
                  <Select onValueChange={(value) => setValue('sex', value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.sex && (
                    <p className="text-sm text-destructive mt-1">{errors.sex.message}</p>
                  )}
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <Label htmlFor="color" className="text-sm font-semibold">Color/Pattern *</Label>
                  <Input
                    id="color"
                    placeholder="e.g., Golden, Black and White"
                    className="h-11"
                    {...register('color')}
                  />
                  {errors.color && (
                    <p className="text-sm text-destructive mt-1">{errors.color.message}</p>
                  )}
                </div>
              </div>

              {/* Distinguishing Marks - Full Width */}
              <div className="space-y-2">
                <Label htmlFor="distinguishing_marks" className="text-sm font-semibold">Distinguishing Marks & Description *</Label>
                <Textarea
                  id="distinguishing_marks"
                  rows={5}
                  placeholder="Describe any unique features, markings, collar, tags, behavior, etc."
                  className="resize-none"
                  {...register('distinguishing_marks')}
                />
                {errors.distinguishing_marks && (
                  <p className="text-sm text-destructive mt-1">{errors.distinguishing_marks.message}</p>
                )}
              </div>

              {/* Third Row - Location and Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location_found" className="text-sm font-semibold">Location Found *</Label>
                  <Input
                    id="location_found"
                    placeholder="e.g., Central Park, 5th Avenue entrance"
                    className="h-11"
                    {...register('location_found')}
                  />
                  {errors.location_found && (
                    <p className="text-sm text-destructive mt-1">{errors.location_found.message}</p>
                  )}
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date_found" className="text-sm font-semibold">Date Found *</Label>
                  <Input
                    id="date_found"
                    type="date"
                    className="h-11"
                    max={new Date().toISOString().split('T')[0]}
                    {...register('date_found')}
                  />
                  {errors.date_found && (
                    <p className="text-sm text-destructive mt-1">{errors.date_found.message}</p>
                  )}
                </div>
              </div>

              {/* Photos - Full Width */}
              <div className="space-y-2">
                <Label htmlFor="photos" className="text-sm font-semibold">Photos *</Label>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="photos"
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer bg-muted/30 hover:bg-muted/50 transition-all hover:border-primary/50"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                      <p className="text-sm font-medium text-muted-foreground">
                        {photos.length > 0
                          ? `${photos.length} photo(s) selected`
                          : 'Click to upload photos or drag and drop'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                    </div>
                    <input
                      id="photos"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoChange}
                    />
                  </label>
                </div>
                {photos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Preview ${index + 1}`}
                          className="h-24 w-full object-cover rounded-lg border-2 border-border"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>

        <div className="px-8 py-6 flex flex-col sm:flex-row gap-4 border-t-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex-1 h-12 border-2 hover:bg-gray-50 font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg"
          >
            {isSubmitting ? (
              <>Submitting...</>
            ) : (
              <>
                <Heart className="mr-2 h-4 w-4" />
                Submit Report
              </>
            )}
          </Button>
        </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
