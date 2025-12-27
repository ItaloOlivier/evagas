'use client';

import { useState } from 'react';
import { Plus, Search, MoreHorizontal, FileText, Send, Check, X, ArrowRight } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';

// Mock data
const mockQuotes = [
  {
    id: 'QUO-2024-0045',
    customer: 'ABC Corporation',
    status: 'sent',
    items: [
      { product: '9kg LPG', qty: 20, price: 180, total: 3600 },
      { product: '19kg LPG', qty: 10, price: 380, total: 3800 },
    ],
    total: 7400,
    validUntil: '2024-01-25',
    createdAt: '2024-01-15T10:30:00Z',
    sentAt: '2024-01-15T11:00:00Z',
  },
  {
    id: 'QUO-2024-0044',
    customer: 'XYZ Industries',
    status: 'accepted',
    items: [{ product: '48kg LPG', qty: 20, price: 950, total: 19000 }],
    total: 19000,
    validUntil: '2024-01-20',
    createdAt: '2024-01-10T09:15:00Z',
    sentAt: '2024-01-10T10:00:00Z',
    acceptedAt: '2024-01-12T14:30:00Z',
  },
  {
    id: 'QUO-2024-0043',
    customer: 'Quick Gas Ltd',
    status: 'converted',
    items: [
      { product: '9kg LPG', qty: 100, price: 160, total: 16000 },
      { product: '14kg LPG', qty: 50, price: 250, total: 12500 },
    ],
    total: 28500,
    validUntil: '2024-01-18',
    createdAt: '2024-01-08T14:00:00Z',
    sentAt: '2024-01-08T15:00:00Z',
    acceptedAt: '2024-01-09T09:00:00Z',
    convertedToOrder: 'ORD-2024-0150',
  },
  {
    id: 'QUO-2024-0042',
    customer: 'Metro Restaurant',
    status: 'draft',
    items: [{ product: '19kg LPG', qty: 8, price: 380, total: 3040 }],
    total: 3040,
    validUntil: '2024-01-30',
    createdAt: '2024-01-15T11:45:00Z',
    sentAt: null,
  },
  {
    id: 'QUO-2024-0041',
    customer: 'City Bakery',
    status: 'rejected',
    items: [{ product: '14kg LPG', qty: 30, price: 280, total: 8400 }],
    total: 8400,
    validUntil: '2024-01-12',
    createdAt: '2024-01-05T08:30:00Z',
    sentAt: '2024-01-05T09:00:00Z',
    rejectedAt: '2024-01-07T10:00:00Z',
    rejectionReason: 'Found better pricing elsewhere',
  },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  sent: { label: 'Sent', variant: 'default' },
  accepted: { label: 'Accepted', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  expired: { label: 'Expired', variant: 'warning' },
  converted: { label: 'Converted', variant: 'success' },
};

export default function QuotesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredQuotes = mockQuotes.filter((quote) => {
    const matchesSearch =
      quote.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
          <p className="text-muted-foreground">
            Create and manage customer quotes
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Quote
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Draft
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockQuotes.filter((q) => q.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Awaiting Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockQuotes.filter((q) => q.status === 'sent').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Accepted (Pending)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockQuotes.filter((q) => q.status === 'accepted').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Converted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockQuotes.filter((q) => q.status === 'converted').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search quotes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quotes table */}
      <Card>
        <CardHeader>
          <CardTitle>All Quotes</CardTitle>
          <CardDescription>
            {filteredQuotes.length} quote{filteredQuotes.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{quote.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>{quote.customer}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {quote.items.length} item{quote.items.length !== 1 ? 's' : ''}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(quote.total)}
                  </TableCell>
                  <TableCell>{formatDate(quote.validUntil)}</TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[quote.status]?.variant || 'default'}>
                      {statusConfig[quote.status]?.label || quote.status}
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
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        {quote.status === 'draft' && (
                          <>
                            <DropdownMenuItem>Edit Quote</DropdownMenuItem>
                            <DropdownMenuItem>
                              <Send className="mr-2 h-4 w-4" />
                              Send to Customer
                            </DropdownMenuItem>
                          </>
                        )}
                        {quote.status === 'sent' && (
                          <>
                            <DropdownMenuItem>
                              <Check className="mr-2 h-4 w-4" />
                              Mark Accepted
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <X className="mr-2 h-4 w-4" />
                              Mark Rejected
                            </DropdownMenuItem>
                          </>
                        )}
                        {quote.status === 'accepted' && (
                          <DropdownMenuItem>
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Convert to Order
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem>Download PDF</DropdownMenuItem>
                        {quote.status === 'draft' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              Delete Quote
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
    </div>
  );
}
