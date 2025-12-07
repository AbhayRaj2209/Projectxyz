import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, Eye } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { BadgeCount } from "@/components/ui/badge-count";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const EConsultationLanding = () => {
  const navigate = useNavigate();

  const breadcrumbItems = [
    { label: "Home", href: "#" },
    { label: "Additional Services", href: "#" },
    { label: "E-Consultation" }
  ];

  const handleBeyond7DaysClick = () => {
    navigate("/consultation-listing");
  };

  const handleTodayClick = () => {
    navigate("/filtered-consultation?filter=today&count=0");
  };

  const handleNext7DaysClick = () => {
    navigate("/filtered-consultation?filter=next7days&count=0");
  };

  const handlePostedTodayClick = () => {
    navigate("/filtered-consultation?filter=posted-today&count=0");
  };

  const handlePostedLast7DaysClick = () => {
    navigate("/filtered-consultation?filter=posted-last7days&count=0");
  };

  const handlePostedEarlierClick = () => {
    navigate("/filtered-consultation?filter=posted-earlier&count=1");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Breadcrumb items={breadcrumbItems} />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Home className="h-5 w-5 mr-2" />
          <h1 className="text-2xl font-bold">E-Consultation</h1>
          <div className="ml-auto flex space-x-2">
            <input 
              type="text" 
              placeholder="Search E-Consultation" 
              className="px-3 py-2 border rounded-md w-64"
            />
            <Button variant="link" className="text-gov-blue">Refine Search</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Image */}
          <div className="bg-gov-blue-dark rounded-lg p-6 text-white">
            <h2 className="text-2xl font-bold mb-4">The eConsultation Module</h2>
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <div className="text-center">
                <div className="bg-white/20 rounded-lg p-4 mb-2">
                  <div className="h-32 bg-white/30 rounded"></div>
                </div>
                <p className="text-sm">Online platform to invite</p>
                <p className="text-orange-400 font-bold">PUBLIC SUGGESTIONS</p>
                <p className="text-sm">on the</p>
                <p className="text-orange-400 font-bold">PROPOSED AMENDMENTS</p>
                <p className="text-sm">and/or</p>
                <p className="text-orange-400 font-bold">DRAFT LEGISLATIONS</p>
              </div>
            </div>
          </div>

          {/* Right Column - Description */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">What is E-Consultation ?</h2>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                Hide
              </Button>
            </div>
            <div className="h-1 w-16 bg-orange-400"></div>
            <p className="text-gray-700 leading-relaxed">
              E-Consultation is an online platform wherein, proposed amendments/draft legislations can be posted, and 
              stakeholders/users can submit their comments and suggestions. Before notifying any crucial amendment or new 
              legislation, MCA will publish the draft document on E-Consultation portal for public consultation and inviting inputs 
              and suggestions of external stakeholders.
            </p>
          </div>
        </div>

        {/* Documents List Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-6">List of documents open for consultation</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Comments due soon */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Comments due soon</h3>
                <div className="space-y-3">
                  <div 
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gov-blue"
                    onClick={handleTodayClick}
                  >
                    <span>Today</span>
                    <BadgeCount count={0} />
                  </div>
                  <div 
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gov-blue"
                    onClick={handleNext7DaysClick}
                  >
                    <span>Next 7 Days</span>
                    <BadgeCount count={0} />
                  </div>
                  <div 
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gov-blue"
                    onClick={handleBeyond7DaysClick}
                  >
                    <span>Beyond 7 Days</span>
                    <BadgeCount count={1} />
                  </div>
                </div>
              </div>

              {/* Posted Recently */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Posted Recently</h3>
                <div className="space-y-3">
                  <div 
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gov-blue"
                    onClick={handlePostedTodayClick}
                  >
                    <span>Today</span>
                    <BadgeCount count={0} />
                  </div>
                  <div 
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gov-blue"
                    onClick={handlePostedLast7DaysClick}
                  >
                    <span>Last 7 Days</span>
                    <BadgeCount count={0} />
                  </div>
                  <div 
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gov-blue"
                    onClick={handlePostedEarlierClick}
                  >
                    <span>Earlier</span>
                    <BadgeCount count={1} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EConsultationLanding;