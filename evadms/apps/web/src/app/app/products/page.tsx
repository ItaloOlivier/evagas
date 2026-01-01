'use client';

import { useState } from 'react';
import { Plus, Search, MoreHorizontal, Package, Loader2 } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import {
  useProducts,
  usePricingTiers,
  useCreateProduct,
  useUpdateProduct,
  useCreatePricingTier,
  type Product,
  type CreateProductDto,
  type CreatePricingTierDto,
} from '@/hooks/use-products';

export default function ProductsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [isCreateTierOpen, setIsCreateTierOpen] = useState(false);

  // Form state
  const [productForm, setProductForm] = useState<CreateProductDto>({
    sku: '',
    name: '',
    description: '',
    type: 'cylinder',
    cylinderSize: undefined,
    unit: 'kg',
    basePrice: 0,
    depositPrice: undefined,
  });

  const [tierForm, setTierForm] = useState<CreatePricingTierDto>({
    name: '',
    description: '',
    discountPercent: 0,
  });

  // Queries
  const { data: productsData, isLoading: productsLoading, error: productsError } = useProducts();
  const { data: pricingTiers, isLoading: tiersLoading } = usePricingTiers();

  // Mutations
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const createTier = useCreatePricingTier();

  const products = productsData?.data || [];

  const filteredProducts = products.filter(
    (product) =>
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateProduct = async () => {
    try {
      await createProduct.mutateAsync(productForm);
      toast({ title: 'Success', description: 'Product created successfully' });
      setIsCreateProductOpen(false);
      setProductForm({
        sku: '',
        name: '',
        description: '',
        type: 'cylinder',
        cylinderSize: undefined,
        unit: 'kg',
        basePrice: 0,
        depositPrice: undefined,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create product',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateProduct = async (id: string, data: Partial<Product>) => {
    try {
      await updateProduct.mutateAsync({ id, ...data });
      toast({ title: 'Success', description: 'Product updated successfully' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update product',
        variant: 'destructive',
      });
    }
  };

  const handleCreateTier = async () => {
    try {
      await createTier.mutateAsync(tierForm);
      toast({ title: 'Success', description: 'Pricing tier created successfully' });
      setIsCreateTierOpen(false);
      setTierForm({ name: '', description: '', discountPercent: 0 });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create pricing tier',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (product: Product) => {
    await handleUpdateProduct(product.id, { active: !product.active });
  };

  if (productsError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load products</p>
          <p className="text-sm text-muted-foreground">
            {(productsError as any)?.message || 'Please try again later'}
          </p>
        </div>
      </div>
    );
  }

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
        <Dialog open={isCreateProductOpen} onOpenChange={setIsCreateProductOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Create a new product in the catalog
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    placeholder="LPG-009"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={productForm.type}
                    onValueChange={(value: any) => setProductForm({ ...productForm, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cylinder">Cylinder</SelectItem>
                      <SelectItem value="bulk_lpg">Bulk LPG</SelectItem>
                      <SelectItem value="delivery_fee">Delivery Fee</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="9kg LPG Cylinder"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Optional description"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                />
              </div>
              {productForm.type === 'cylinder' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cylinderSize">Cylinder Size (kg)</Label>
                    <Input
                      id="cylinderSize"
                      type="number"
                      placeholder="9"
                      value={productForm.cylinderSize || ''}
                      onChange={(e) =>
                        setProductForm({ ...productForm, cylinderSize: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="depositPrice">Deposit Price</Label>
                    <Input
                      id="depositPrice"
                      type="number"
                      step="0.01"
                      placeholder="350.00"
                      value={productForm.depositPrice || ''}
                      onChange={(e) =>
                        setProductForm({ ...productForm, depositPrice: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Base Price</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    step="0.01"
                    placeholder="180.00"
                    value={productForm.basePrice || ''}
                    onChange={(e) =>
                      setProductForm({ ...productForm, basePrice: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    value={productForm.unit}
                    onValueChange={(value) => setProductForm({ ...productForm, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="litre">Litre</SelectItem>
                      <SelectItem value="each">Each</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateProductOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProduct} disabled={createProduct.isPending}>
                {createProduct.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                {productsLoading ? (
                  'Loading...'
                ) : (
                  `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} found`
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
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
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No products found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <span className="font-medium">{product.name}</span>
                                {product.description && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {product.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {product.type?.replace('_', ' ') || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {product.cylinderSize ? `${product.cylinderSize} ${product.unit}` : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(product.basePrice)}
                            {product.type === 'bulk_lpg' && (
                              <span className="text-muted-foreground">/L</span>
                            )}
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
                                <DropdownMenuItem
                                  className={product.active ? 'text-destructive' : ''}
                                  onClick={() => handleToggleActive(product)}
                                >
                                  {product.active ? 'Deactivate' : 'Activate'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
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
                <Dialog open={isCreateTierOpen} onOpenChange={setIsCreateTierOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Tier
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                      <DialogTitle>Add Pricing Tier</DialogTitle>
                      <DialogDescription>
                        Create a new pricing tier for customer segments
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="tierName">Tier Name</Label>
                        <Input
                          id="tierName"
                          placeholder="Commercial"
                          value={tierForm.name}
                          onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tierDescription">Description</Label>
                        <Input
                          id="tierDescription"
                          placeholder="Rates for commercial customers"
                          value={tierForm.description}
                          onChange={(e) =>
                            setTierForm({ ...tierForm, description: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="discount">Discount Percentage</Label>
                        <Input
                          id="discount"
                          type="number"
                          min="0"
                          max="100"
                          placeholder="5"
                          value={tierForm.discountPercent || ''}
                          onChange={(e) =>
                            setTierForm({ ...tierForm, discountPercent: Number(e.target.value) })
                          }
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateTierOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateTier} disabled={createTier.isPending}>
                        {createTier.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Create Tier
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {tiersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
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
                    {!pricingTiers || pricingTiers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No pricing tiers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      pricingTiers.map((tier) => (
                        <TableRow key={tier.id}>
                          <TableCell className="font-medium">{tier.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {tier.description || '-'}
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
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
