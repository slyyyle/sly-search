"use client"

import type React from 'react';
import type { Infobox, InfoboxAttribute, InfoboxUrl } from '@/types/search'; // Import specific sub-types
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from 'next/image'; // Use next/image for optimized images
import { ExternalLink } from "lucide-react"
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from 'react';

interface InfoboxResultsProps {
  infoboxes: Infobox[];
  openInNewTab: boolean;
}

const InfoboxResults: React.FC<InfoboxResultsProps> = ({ infoboxes, openInNewTab }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!infoboxes || infoboxes.length === 0) {
    return null; // Don't render anything if no infoboxes
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? infoboxes.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === infoboxes.length - 1 ? 0 : prev + 1));
  };

  const infobox = infoboxes[currentIndex];
  const sourceName = infobox.engine || 'Unknown Source';
  const showNavigation = infoboxes.length > 1;

  const getInfoboxImage = (infobox: Infobox): string | null => {
    if (infobox.img_src) return infobox.img_src;
    if (infobox.attributes && Array.isArray(infobox.attributes)) {
      for (const attr of infobox.attributes) {
        if (attr.image && Array.isArray(attr.image) && attr.image.length > 0 && attr.image[0].src) {
          return attr.image[0].src;
        }
      }
    }
    return null;
  };

  return (
    <div className="relative">
      {/* Engine Pane Bar */}
      <div className="flex rounded-md overflow-x-auto bg-black/80 border border-border/40 mb-2 p-1 gap-1 themed-gradient-border mx-auto" style={{ minHeight: '2.5rem', maxWidth: 'fit-content' }}>
        {infoboxes.map((box, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={box.engine || idx}
              onClick={() => setCurrentIndex(idx)}
              className={
                `flex items-center px-4 py-1 rounded-md transition-all duration-200 whitespace-nowrap font-medium ` +
                (isActive
                  ? 'themed-gradient-transparent text-white shadow'
                  : 'bg-transparent text-muted-foreground hover:bg-[#176BEF]/20')
              }
              style={{ flex: '0 0 auto' }}
            >
              <span>{box.engine || 'Unknown'}</span>
            </button>
          );
        })}
      </div>
      {/* Infobox Card */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          {infobox.name && <CardTitle className="text-lg">{infobox.name}</CardTitle>}
          {infobox.entity && <CardDescription>{infobox.entity}</CardDescription>} 
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 pt-0">
          {/* Image Column (optional) */}
          {(() => {
            const imageUrl = getInfoboxImage(infobox);
            if (!imageUrl) return null;
            return (
              <div className="w-full sm:w-1/4 flex-shrink-0">
                <Image 
                  src={imageUrl} 
                  alt={infobox.name || 'Infobox image'} 
                  width={150}
                  height={150}
                  className="rounded-md object-cover w-full h-auto" 
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  unoptimized
                />
              </div>
            );
          })()}
          {/* Content Column */}
          <div className="flex-1 flex flex-col justify-center">
            {/* Main Content */}
            {infobox.content && <p className="text-sm mb-3">{infobox.content}</p>}
            
            {/* Attributes/Facts */}
            {infobox.attributes && infobox.attributes.length > 0 && (
              <div className="text-xs space-y-1 mb-3">
                {infobox.attributes.map((attr: InfoboxAttribute, i: number) => (
                  <div key={`attr-${i}`}>
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
                    <li key={`url-${i}`}>
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
    </div>
  );
};

export default InfoboxResults; 