import { Link } from 'react-router-dom';
import { MapPin, Calendar, Info } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Pet {
  id: string;
  status: string;
  species: string;
  breed: string;
  color: string;
  photos: string[];
  location: string;
  date_found_or_lost: string;
  submitted_by: {
    name: string;
  };
}

interface PetCardProps {
  pet: Pet;
  onActionClick?: (pet: Pet) => void;
  actionLabel?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Listed Found':
      return 'bg-secondary text-secondary-foreground';
    case 'Listed Lost':
      return 'bg-warning text-warning-foreground';
    case 'Available for Adoption':
      return 'bg-primary text-primary-foreground';
    case 'Reunited':
      return 'bg-success text-success-foreground';
    case 'Pending Found Approval':
    case 'Pending Lost Approval':
      return 'bg-pending text-pending-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const PetCard = ({ pet, onActionClick, actionLabel }: PetCardProps) => {
  const photoUrl = Array.isArray(pet.photos) && pet.photos.length > 0
    ? (typeof pet.photos[0] === 'string' ? pet.photos[0] : pet.photos[0].url)
    : 'https://via.placeholder.com/400';
  
  const isFound = pet.status === 'Listed Found';
  
  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-2 border-gray-200 bg-white rounded-2xl">
      <Link to={`/pets/${pet.id}`}>
        <div className="aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 relative">
          <img
            src={photoUrl}
            alt={`${pet.species} - ${pet.breed}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400';
            }}
          />
          <div className="absolute top-3 right-3">
            <Badge 
              className={`${
                isFound 
                  ? 'bg-green-500 text-white border-green-600' 
                  : 'bg-orange-500 text-white border-orange-600'
              } font-semibold shadow-lg border-2`}
            >
              {pet.status.replace('Listed ', '')}
            </Badge>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Link>
      
      <CardContent className="p-5">
        <div className="mb-3">
          <Link to={`/pets/${pet.id}`} className="block">
            <h3 className="font-bold text-xl text-gray-900 mb-1 truncate group-hover:text-green-600 transition-colors">
              {pet.breed || 'Unknown Breed'}
            </h3>
            <p className="text-sm font-medium text-gray-600">{pet.species || 'Unknown Species'}</p>
          </Link>
        </div>

        <div className="space-y-2.5 mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <MapPin className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="truncate font-medium">{pet.location || 'Location not specified'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="font-medium">{format(new Date(pet.date_found_or_lost || new Date()), 'MMM d, yyyy')}</span>
          </div>
        </div>

        {pet.color && (
          <div className="mb-3 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-0.5">Color</p>
            <p className="text-sm font-semibold text-gray-900">{pet.color}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-5 pt-0 flex gap-2">
        <Button 
          variant="outline" 
          asChild 
          className="flex-1 border-2 hover:bg-green-50 hover:border-green-200 font-semibold"
        >
          <Link to={`/pets/${pet.id}`}>
            <Info className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </Button>
        {onActionClick && actionLabel && (
          <Button 
            onClick={() => onActionClick(pet)} 
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg"
          >
            {actionLabel}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
