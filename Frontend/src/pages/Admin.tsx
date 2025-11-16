import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, PawPrint, Heart, Search, Home, Shield, CheckCircle, X, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { adminAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function Admin() {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [users, setUsers] = useState([]);
  const [pets, setPets] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [pendingAdoptions, setPendingAdoptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptType, setAcceptType] = useState<'report' | 'adoption'>('report');
  const [verificationParams, setVerificationParams] = useState({
    verified_photos: false,
    verified_location: false,
    verified_contact: false,
    verified_identity: false,
    verified_adopter_identity: false,
    verified_home_check: false,
    verified_references: false,
    verified_financial_stability: false,
  });
  const [acceptNotes, setAcceptNotes] = useState('');
  const [adopterId, setAdopterId] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadDashboardData();
  }, [isAdmin, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashData, pendingData, adoptionData] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getPendingReports(),
        adminAPI.getPendingAdoptionRequests(),
      ]);
      setDashboardData(dashData);
      setPendingReports(pendingData);
      setPendingAdoptions(adoptionData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      await adminAPI.deleteUser(userId);
      setUsers(users.filter(u => u._id !== userId));
      toast({
        title: 'Success',
        description: 'User deactivated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to deactivate user',
        variant: 'destructive',
      });
    }
  };

  const handleAcceptReport = async (reportId: string) => {
    setAcceptingId(reportId);
    setAcceptType('report');
    setShowAcceptModal(true);
  };

  const handleAcceptAdoption = async (adoptionId: string) => {
    setAcceptingId(adoptionId);
    setAcceptType('adoption');
    setShowAcceptModal(true);
  };

  const submitAcceptance = async () => {
    if (!acceptingId) return;

    try {
      if (acceptType === 'report') {
        await adminAPI.acceptReport(acceptingId, acceptNotes, verificationParams);
        setPendingReports(pendingReports.filter(r => r._id !== acceptingId));
        toast({
          title: 'Success',
          description: 'Report accepted and listed',
        });
      } else {
        await adminAPI.acceptAdoptionRequest(acceptingId, acceptNotes, verificationParams, adopterId || undefined);
        setPendingAdoptions(pendingAdoptions.filter(a => a._id !== acceptingId));
        toast({
          title: 'Success',
          description: 'Adoption request approved',
        });
      }
      
      setShowAcceptModal(false);
      setAcceptingId(null);
      setAcceptNotes('');
      setAdopterId('');
      setVerificationParams({
        verified_photos: false,
        verified_location: false,
        verified_contact: false,
        verified_identity: false,
        verified_adopter_identity: false,
        verified_home_check: false,
        verified_references: false,
        verified_financial_stability: false,
      });
      loadDashboardData(); // Refresh stats
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept request',
        variant: 'destructive',
      });
    }
  };

  const handleRejectReport = async (reportId: string) => {
    if (!rejectReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    try {
      await adminAPI.rejectReport(reportId, rejectReason);
      setPendingReports(pendingReports.filter(r => r._id !== reportId));
      setShowRejectModal(false);
      setRejectingId(null);
      setRejectReason('');
      toast({
        title: 'Success',
        description: 'Report rejected',
      });
      loadDashboardData(); // Refresh stats
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject report',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Welcome, {user?.name}</p>
          </div>
          <Badge variant="default" className="text-base px-3 py-1">
            Admin User
          </Badge>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
            <Link to="/admin/found-pets">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <PawPrint className="h-6 w-6 text-green-600" />
                    Found Pets
                  </span>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardTitle>
                <CardDescription>Manage and verify found pet reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {dashboardData?.pending?.found || 0} Pending
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {dashboardData?.active?.found || 0} Active Reports
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
            <Link to="/admin/lost-pets">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Search className="h-6 w-6 text-orange-600" />
                    Lost Pets
                  </span>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardTitle>
                <CardDescription>Manage and verify lost pet reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {dashboardData?.pending?.lost || 0} Pending
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {dashboardData?.active?.lost || 0} Active Reports
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
            <Link to="/admin/adopt">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Home className="h-6 w-6 text-blue-600" />
                    Adoption Requests
                  </span>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardTitle>
                <CardDescription>Verify and approve adoption requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {pendingAdoptions.length} Pending
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {dashboardData?.pets?.adoptable || 0} Available
                </p>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Stats Grid */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Pending Reports */}
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-900">Pending Reports</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{dashboardData.pending?.total || 0}</div>
                <p className="text-xs text-orange-700 mt-1">
                  {dashboardData.pending?.lost || 0} lost • {dashboardData.pending?.found || 0} found
                </p>
              </CardContent>
            </Card>

            {/* Total Users */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.users?.total || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardData.users?.regular || 0} regular • {dashboardData.users?.rescuers || 0} rescuers
                </p>
              </CardContent>
            </Card>

            {/* Active Reports */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Reports</CardTitle>
                <PawPrint className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.active?.total || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardData.active?.found || 0} found • {dashboardData.active?.lost || 0} lost
                </p>
              </CardContent>
            </Card>

            {/* Matched */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Matched</CardTitle>
                <Heart className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{dashboardData.matched || 0}</div>
                <p className="text-xs text-green-600 mt-1">Potential matches</p>
              </CardContent>
            </Card>

            {/* Reunited */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Found Pets</CardTitle>
                <Heart className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.pets?.found || 0}</div>
                <p className="text-xs text-green-600 mt-1">Active Reports</p>
              </CardContent>
            </Card>

            {/* Lost Pets */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lost Pets</CardTitle>
                <Search className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.pets?.lost || 0}</div>
                <p className="text-xs text-orange-600 mt-1">Missing Pets</p>
              </CardContent>
            </Card>

            {/* Adoptable Pets */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Adoptable Pets</CardTitle>
                <Home className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.pets?.adoptable || 0}</div>
                <p className="text-xs text-blue-600 mt-1">Ready for Adoption</p>
              </CardContent>
            </Card>

            {/* Admins */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                <Shield className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.users?.admins || 0}</div>
                <p className="text-xs text-purple-600 mt-1">Admin Accounts</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Tables */}
        <Tabs defaultValue="pending-reports" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending-reports" className="flex items-center gap-2">
              Pending Reports
              {(dashboardData?.pending?.total || 0) > 0 && (
                <Badge variant="destructive" className="ml-2">{dashboardData.pending.total}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending-adoptions" className="flex items-center gap-2">
              Pending Adoptions
              {pendingAdoptions.length > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingAdoptions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="recent-users">Recent Users</TabsTrigger>
            <TabsTrigger value="recent-pets">Recent Pets</TabsTrigger>
          </TabsList>

          {/* Pending Reports Tab */}
          <TabsContent value="pending-reports">
            <Card>
              <CardHeader>
                <CardTitle>Pending Pet Reports</CardTitle>
                <CardDescription>Verify and approve or reject pending lost/found reports</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingReports.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <p className="text-muted-foreground">No pending reports! All reports have been verified.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingReports.map((report: any) => (
                      <div key={report._id} className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={report.report_type === 'found' ? 'default' : 'secondary'}>
                                {report.report_type.toUpperCase()}
                              </Badge>
                              <h3 className="font-semibold text-lg">
                                {report.species} - {report.breed || 'Mixed'}
                              </h3>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              <strong>Description:</strong> {report.distinguishing_marks}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <strong>Location:</strong> {report.last_seen_or_found_location_text} 
                              {report.last_seen_or_found_pincode && ` (${report.last_seen_or_found_pincode})`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <strong>Date:</strong> {format(new Date(report.last_seen_or_found_date), 'MMM dd, yyyy')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <strong>Reported by:</strong> {report.submitted_by?.name} ({report.submitted_by?.email})
                            </p>
                            {report.photos && report.photos.length > 0 && (
                              <div className="mt-2 flex gap-2">
                                {report.photos.slice(0, 3).map((photo: any, idx: number) => (
                                  <img
                                    key={idx}
                                    src={photo.url}
                                    alt={`Pet ${idx + 1}`}
                                    className="h-16 w-16 rounded object-cover"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 gap-1"
                              onClick={() => handleAcceptReport(report._id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1"
                              onClick={() => {
                                setRejectingId(report._id);
                                setShowRejectModal(true);
                              }}
                            >
                              <X className="h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reject Modal */}
            {showRejectModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle>Reject Report</CardTitle>
                    <CardDescription>Provide a reason for rejection</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Rejection Reason *</label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Explain why this report is being rejected..."
                        className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowRejectModal(false);
                          setRejectReason('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleRejectReport(rejectingId!)}
                      >
                        Reject Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Verification/Accept Modal */}
            {showAcceptModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <CardHeader>
                    <CardTitle>
                      {acceptType === 'report' ? 'Accept & Verify Report' : 'Accept & Verify Adoption Request'}
                    </CardTitle>
                    <CardDescription>
                      {acceptType === 'report' 
                        ? 'Verify at least 2 parameters before accepting (photos, location, contact, identity)'
                        : 'Verify at least 3 parameters before accepting (identity, home check, references, financial stability)'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Verification Parameters */}
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Verification Parameters</Label>
                      
                      {acceptType === 'report' ? (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="verified_photos"
                              checked={verificationParams.verified_photos}
                              onCheckedChange={(checked) =>
                                setVerificationParams({ ...verificationParams, verified_photos: !!checked })
                              }
                            />
                            <Label htmlFor="verified_photos" className="cursor-pointer">
                              Photos Verified (Pet photos are clear and match description)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="verified_location"
                              checked={verificationParams.verified_location}
                              onCheckedChange={(checked) =>
                                setVerificationParams({ ...verificationParams, verified_location: !!checked })
                              }
                            />
                            <Label htmlFor="verified_location" className="cursor-pointer">
                              Location Verified (Location details are accurate)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="verified_contact"
                              checked={verificationParams.verified_contact}
                              onCheckedChange={(checked) =>
                                setVerificationParams({ ...verificationParams, verified_contact: !!checked })
                              }
                            />
                            <Label htmlFor="verified_contact" className="cursor-pointer">
                              Contact Verified (Reporter contact information is valid)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="verified_identity"
                              checked={verificationParams.verified_identity}
                              onCheckedChange={(checked) =>
                                setVerificationParams({ ...verificationParams, verified_identity: !!checked })
                              }
                            />
                            <Label htmlFor="verified_identity" className="cursor-pointer">
                              Identity Verified (Reporter identity is confirmed)
                            </Label>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="verified_adopter_identity"
                              checked={verificationParams.verified_adopter_identity}
                              onCheckedChange={(checked) =>
                                setVerificationParams({ ...verificationParams, verified_adopter_identity: !!checked })
                              }
                            />
                            <Label htmlFor="verified_adopter_identity" className="cursor-pointer">
                              Adopter Identity Verified
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="verified_home_check"
                              checked={verificationParams.verified_home_check}
                              onCheckedChange={(checked) =>
                                setVerificationParams({ ...verificationParams, verified_home_check: !!checked })
                              }
                            />
                            <Label htmlFor="verified_home_check" className="cursor-pointer">
                              Home Check Completed
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="verified_references"
                              checked={verificationParams.verified_references}
                              onCheckedChange={(checked) =>
                                setVerificationParams({ ...verificationParams, verified_references: !!checked })
                              }
                            />
                            <Label htmlFor="verified_references" className="cursor-pointer">
                              References Verified
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="verified_financial_stability"
                              checked={verificationParams.verified_financial_stability}
                              onCheckedChange={(checked) =>
                                setVerificationParams({ ...verificationParams, verified_financial_stability: !!checked })
                              }
                            />
                            <Label htmlFor="verified_financial_stability" className="cursor-pointer">
                              Financial Stability Confirmed
                            </Label>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="adopter_id">Adopter User ID (Optional)</Label>
                            <Input
                              id="adopter_id"
                              value={adopterId}
                              onChange={(e) => setAdopterId(e.target.value)}
                              placeholder="Enter adopter's user ID"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="accept_notes">Additional Notes (Optional)</Label>
                      <textarea
                        id="accept_notes"
                        value={acceptNotes}
                        onChange={(e) => setAcceptNotes(e.target.value)}
                        placeholder="Add any additional verification notes..."
                        className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAcceptModal(false);
                          setAcceptNotes('');
                          setAdopterId('');
                          setVerificationParams({
                            verified_photos: false,
                            verified_location: false,
                            verified_contact: false,
                            verified_identity: false,
                            verified_adopter_identity: false,
                            verified_home_check: false,
                            verified_references: false,
                            verified_financial_stability: false,
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={submitAcceptance} className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept & Verify
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Pending Adoptions Tab */}
          <TabsContent value="pending-adoptions">
            <Card>
              <CardHeader>
                <CardTitle>Pending Adoption Requests</CardTitle>
                <CardDescription>Verify and approve adoption requests with verification parameters</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingAdoptions.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <p className="text-muted-foreground">No pending adoption requests!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingAdoptions.map((adoption: any) => (
                      <div key={adoption._id} className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="default">ADOPTION</Badge>
                              <h3 className="font-semibold text-lg">
                                {adoption.species} - {adoption.breed || 'Mixed'}
                              </h3>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              <strong>Description:</strong> {adoption.distinguishing_marks}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <strong>Location:</strong> {adoption.last_seen_or_found_location_text || 'N/A'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <strong>Requested by:</strong> {adoption.submitted_by?.name} ({adoption.submitted_by?.email})
                            </p>
                            {adoption.photos && adoption.photos.length > 0 && (
                              <div className="mt-2 flex gap-2">
                                {adoption.photos.slice(0, 3).map((photo: any, idx: number) => (
                                  <img
                                    key={idx}
                                    src={photo.url}
                                    alt={`Pet ${idx + 1}`}
                                    className="h-16 w-16 rounded object-cover"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 gap-1"
                              onClick={() => handleAcceptAdoption(adoption._id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Accept
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Users Tab */}
          <TabsContent value="recent-users">
            <Card>
              <CardHeader>
                <CardTitle>Recent User Registrations</CardTitle>
                <CardDescription>Latest 10 users who registered</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                            No users yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((u: any) => (
                          <TableRow key={u._id}>
                            <TableCell className="font-medium">{u.name}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>
                              <Badge variant={u.role === 'admin' ? 'default' : u.role === 'rescuer' ? 'secondary' : 'outline'}>
                                {u.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(u.createdAt), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>
                              {u.role !== 'admin' && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeactivateUser(u._id)}
                                >
                                  Deactivate
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Pets Tab */}
          <TabsContent value="recent-pets">
            <Card>
              <CardHeader>
                <CardTitle>Recent Pet Reports</CardTitle>
                <CardDescription>Latest 10 pet reports (Found, Lost, & Adoption)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pet Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Breed</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reported</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                            No pets reported yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        pets.map((p: any) => (
                          <TableRow key={p._id}>
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell>
                              <Badge variant={
                                p.type === 'found' ? 'default' :
                                p.type === 'lost' ? 'secondary' : 'outline'
                              }>
                                {p.type}
                              </Badge>
                            </TableCell>
                            <TableCell>{p.breed || 'Unknown'}</TableCell>
                            <TableCell className="text-sm">{p.location?.city || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant={p.status === 'active' ? 'default' : 'outline'}>
                                {p.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(p.createdAt), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>
                              {p.status && p.status !== 'resolved' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // Mark as resolved action
                                    toast({
                                      title: 'Info',
                                      description: 'This feature will be implemented in the next update',
                                    });
                                  }}
                                >
                                  Mark Resolved
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
