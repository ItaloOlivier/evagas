'use client';

import { useState } from 'react';
import { Plus, Search, MoreHorizontal, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';

// Mock data
const mockProducts = [
  { id: '1', sku: 'LPG-009', name: '9kg LPG Cylinder', type: 'cylinder', size: 9, unit: 'kg', basePrice: 180, depositPrice: 350, active: true },
  { id: '2', sku: 'LPG-014', name: '14kg LPG Cylinder', type: 'cylinder', size: 14, unit: 'kg', basePrice: 280, depositPrice: 450, active: true },
  { id: '3', sku: 'LPG-019', name: '19kg LPG Cylinder', type: 'cylinder', size: 19, unit: 'kg', basePrice: 380, depositPrice: 550, active: true },
  { id: '4', sku: 'LPG-048', name: '48kg LPG Cylinder', type: 'cylinder', size: 48, unit: 'kg', basePrice: 950, depositPrice: 1200, active: true },
  { id: '5', sku: 'BULK-LPG', name: 'Bulk LPG', type: 'bulk', size: null, unit: 'litre', basePrice: 12.50, depositPrice: null, active: true },
  { id: '6', sku: 'DEL-STD', name: 'Standard Delivery', type: 'service', size: null, unit: 'each', basePrice: 150, depositPrice: null, active: true },
];

const mockPricingTiers = [
  { id: '1', name: 'Standard', description: 'Default pricing for all customers', isDefault: true, discountPercent: 0 },
  { id: '2', name: 'Commercial', description: 'Discounted rates for commercial customers', isDefault: false, discountPercent: 5 },
  { id: '3', name: 'Industrial', description: 'Special rates for industrial customers', isDefault: false, discountPercent: 10 },
  { id: '4', name: 'Reseller', description: 'Wholesale pricing for resellers', isDefault: false, discountPercent: 15 },
];

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = mockProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage products and pricing tiers
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Tiers</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Products</CardTitle>
              <CardDescription>
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Base Price</TableHead>
                    <TableHead className="text-right">Deposit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {product.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {product.size ? `${product.size} ${product.unit}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.basePrice)}
                        {product.type === 'bulk' && <span className="text-muted-foreground">/L</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.depositPrice ? formatCurrency(product.depositPrice) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.active ? 'success' : 'secondary'}>
                          {product.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Edit Product</DropdownMenuItem>
                            <DropdownMenuItem>View Pricing</DropdownMenuItem>
                            <DropdownMenuItem>Set Customer Prices</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              Deactivate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pricing Tiers</CardTitle>
                  <CardDescription>
                    Configure tiered pricing for different customer segments
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Tier
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPricingTiers.map((tier) => (
                    <TableRow key={tier.id}>
                      <TableCell className="font-medium">{tier.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {tier.description}
                      </TableCell>
                      <TableCell className="text-right">
                        {tier.discountPercent > 0 ? (
                          <span className="text-green-600">-{tier.discountPercent}%</span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {tier.isDefault && <Badge>Default</Badge>}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Edit Tier</DropdownMenuItem>
                            <DropdownMenuItem>Set Product Prices</DropdownMenuItem>
                            {!tier.isDefault && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  Delete Tier
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
