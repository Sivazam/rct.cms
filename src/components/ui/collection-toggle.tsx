"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IndianRupee, RefreshCw, Package } from "lucide-react"

interface CollectionToggleProps {
  renewalCollections: number
  deliveryCollections: number
  onToggleChange: (showWithDispatch: boolean) => void
}

export function CollectionToggle({ 
  renewalCollections, 
  deliveryCollections, 
  onToggleChange 
}: CollectionToggleProps) {
  const [showWithDispatch, setShowWithDispatch] = useState(true)

  // Safety check for onToggleChange
  const safeOnToggleChange = (withDispatch: boolean) => {
    try {
      if (typeof onToggleChange === 'function') {
        onToggleChange(withDispatch);
      } else {
        console.warn('CollectionToggle: onToggleChange is not a function');
      }
    } catch (error) {
      console.error('CollectionToggle: Error in onToggleChange:', error);
    }
  }

  const handleToggle = (withDispatch: boolean) => {
    setShowWithDispatch(withDispatch)
    safeOnToggleChange(withDispatch)
  }

  // Safety checks for numeric values
  const safeRenewalCollections = typeof renewalCollections === 'number' ? renewalCollections : 0;
  const safeDeliveryCollections = typeof deliveryCollections === 'number' ? deliveryCollections : 0;

  const totalCollections = safeRenewalCollections + (showWithDispatch ? safeDeliveryCollections : 0)

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold text-orange-800">Collection Breakdown</h3>
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-orange-600" />
              <span className="text-2xl font-bold text-orange-800">
                {totalCollections.toLocaleString()}
              </span>
              <Badge variant="outline" className="border-orange-200 text-orange-700">
                {showWithDispatch ? 'Total Collections' : 'Renewals Only'}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {/* Toggle Buttons */}
            <div className="flex gap-2">
              <Button
                variant={showWithDispatch ? "default" : "outline"}
                size="sm"
                onClick={() => handleToggle(true)}
                className="flex items-center gap-2"
              >
                <Package className="h-4 w-4" />
                With Dispatch
              </Button>
              <Button
                variant={!showWithDispatch ? "default" : "outline"}
                size="sm"
                onClick={() => handleToggle(false)}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Without Dispatch
              </Button>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between bg-white p-2 rounded">
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 text-green-600" />
                  Renewals:
                </span>
                <span className="font-semibold">₹{safeRenewalCollections.toLocaleString()}</span>
              </div>
              {showWithDispatch && (
                <div className="flex items-center justify-between bg-white p-2 rounded">
                  <span className="flex items-center gap-1">
                    <Package className="h-3 w-3 text-blue-600" />
                    Dispatch:
                  </span>
                  <span className="font-semibold">₹{safeDeliveryCollections.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}