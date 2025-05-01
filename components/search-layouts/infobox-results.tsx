"use client"

import type React from 'react';
import type { Infobox, InfoboxAttribute, InfoboxUrl } from '@/types/search'; // Import specific sub-types
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from 'next/image'; // Use next/image for optimized images
import { ExternalLink } from "lucide-react"

interface InfoboxResultsProps {
  infoboxes: Infobox[];
  openInNewTab: boolean;
}

const InfoboxResults: React.FC<InfoboxResultsProps> = ({ infoboxes, openInNewTab }) => {
  if (!infoboxes || infoboxes.length === 0) {
    return null; // Don't render anything if no infoboxes
  }

  console.log("[InfoboxResults] Rendering infoboxes:", infoboxes);

  return (
    <div className="grid grid-cols-1 gap-4"> {/* Simple grid layout for multiple infoboxes if needed */}
      {infoboxes.map((infobox, index) => (
        <Card key={`infobox-${index}-${infobox.id || index}`} className="overflow-hidden">
          <CardHeader className="pb-2">
             {infobox.name && <CardTitle className="text-lg">{infobox.name}</CardTitle>}
             {/* Optionally display entity type or source if available */}
             {infobox.entity && <CardDescription>{infobox.entity}</CardDescription>} 
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 pt-0">
            {/* Image Column (optional) */}
            {infobox.img_src && (
               <div className="w-full sm:w-1/4 flex-shrink-0">
                   {/* Basic image rendering, consider adding aspect ratio control */}
                  <Image 
                     src={infobox.img_src} 
                     alt={infobox.name || 'Infobox image'} 
                     width={150} // Example width, adjust as needed
                     height={150} // Example height, adjust as needed
                     className="rounded-md object-cover w-full h-auto" 
                     // Consider adding error handling or placeholder
                     onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} // Hide on error
                     unoptimized={!infobox.img_src.startsWith('/')} // Avoid optimization for external URLs
                  />
               </div>
            )}
            {/* Content Column */}
            <div className="flex-1 flex flex-col justify-center">
               {/* Main Content */}
               {infobox.content && <p className="text-sm mb-3">{infobox.content}</p>}
               
               {/* Attributes/Facts (if available and structured) */}
               {infobox.attributes && infobox.attributes.length > 0 && (
                 <div className="text-xs space-y-1 mb-3">
                   {infobox.attributes.map((attr: InfoboxAttribute, i: number) => (
                     <div key={`attr-${index}-${i}`}>
                       <span className="font-semibold">{attr.label || `Attribute ${i + 1}`}:</span> {attr.value}
                     </div>
                   ))}
                 </div>
               )}

               {/* Source URLs */}
               {infobox.urls && infobox.urls.length > 0 && (
                  <div className="text-xs space-y-1">
                     <span className="font-semibold">Sources:</span>
                     <ul className="list-disc list-inside ml-2">
                        {infobox.urls.map((urlInfo: InfoboxUrl, i: number) => (
                           <li key={`url-${index}-${i}`}>
                              <a 
                                 href={urlInfo.url} 
                                 target={openInNewTab ? '_blank' : '_self'}
                                 rel="noopener noreferrer"
                                 className="text-blue-600 hover:underline break-all"
                              >
                                 {urlInfo.title || urlInfo.url}
                              </a>
                           </li>
                        ))}
                     </ul>
                  </div>
               )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default InfoboxResults; 