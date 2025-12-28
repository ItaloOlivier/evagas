'use client';

import { useState } from 'react';
import { Plus, Search, MoreHorizontal, FileText, Send, Check, X, ArrowRight, Loader2 } from 'lucide-react';
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
import { useToast } from '@/components/ui/use-toast';
import {
  useQuotes,
  useQuoteStats,
  useSendQuote,
  useAcceptQuote,
  useRejectQuote,
  useConvertQuote,
  type Quote,
} from '@/hooks/use-quotes';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  sent: { label: 'Sent', variant: 'default' },
  accepted: { label: 'Accepted', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  expired: { label: 'Expired', variant: 'warning' },
  converted: { label: 'Converted', variant: 'success' },
};

export default function QuotesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Queries
  const { data: quotesData, isLoading, error } = useQuotes();
  const { data: stats } = useQuoteStats();

  // Mutations
  const sendQuote = useSendQuote();
  const acceptQuote = useAcceptQuote();
  const rejectQuote = useRejectQuote();
  const convertQuote = useConvertQuote();

  const quotes = quotesData?.data || [];

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch =
      quote.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSendQuote = async (quote: Quote) => {
    try {
      await sendQuote.mutateAsync(quote.id);
      toast({ title: 'Success', description: 'Quote sent to customer' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send quote',
        variant: 'destructive',
      });
    }
  };

  const handleAcceptQuote = async (quote: Quote) => {
    try {
      await acceptQuote.mutateAsync(quote.id);
      toast({ title: 'Success', description: 'Quote marked as accepted' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to accept quote',
        variant: 'destructive',
      });
    }
  };

  const handleRejectQuote = async (quote: Quote) => {
    try {
      await rejectQuote.mutateAsync({ id: quote.id, reason: 'Rejected by admin' });
      toast({ title: 'Success', description: 'Quote marked as rejected' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reject quote',
        variant: 'destructive',
      });
    }
  };

  const handleConvertQuote = async (quote: Quote) => {
    try {
      await convertQuote.mutateAsync(quote.id);
      toast({ title: 'Success', description: 'Quote converted to order' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to convert quote',
        variant: 'destructive',
      });
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load quotes</p>
          <p className="text-sm text-muted-foreground">
            {(error as any)?.message || 'Please try again later'}
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
              {stats?.draft ?? quotes.filter((q) => q.status === 'draft').length}
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
              {stats?.sent ?? quotes.filter((q) => q.status === 'sent').length}
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
              {stats?.accepted ?? quotes.filter((q) => q.status === 'accepted').length}
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
              {stats?.converted ?? quotes.filter((q) => q.status === 'converted').length}
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
            {isLoading
              ? 'Loading...'
              : `${filteredQuotes.length} quote${filteredQuotes.length !== 1 ? 's' : ''} found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
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
                {filteredQuotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No quotes found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{quote.quoteNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell>{quote.customer?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {quote.items?.length || 0} item{(quote.items?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(quote.totalAmount)}
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
                                <DropdownMenuItem onClick={() => handleSendQuote(quote)}>
                                  <Send className="mr-2 h-4 w-4" />
                                  Send to Customer
                                </DropdownMenuItem>
                              </>
                            )}
                            {quote.status === 'sent' && (
                              <>
                                <DropdownMenuItem onClick={() => handleAcceptQuote(quote)}>
                                  <Check className="mr-2 h-4 w-4" />
                                  Mark Accepted
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRejectQuote(quote)}>
                                  <X className="mr-2 h-4 w-4" />
                                  Mark Rejected
                                </DropdownMenuItem>
                              </>
                            )}
                            {quote.status === 'accepted' && (
                              <DropdownMenuItem onClick={() => handleConvertQuote(quote)}>
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
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
