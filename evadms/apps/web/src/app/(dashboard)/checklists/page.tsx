'use client';

import { Plus, MoreHorizontal, ClipboardCheck, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { formatDateTime } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import {
  useChecklistTemplates,
  useChecklistResponses,
  useChecklistStats,
  useActivateChecklistTemplate,
  useArchiveChecklistTemplate,
} from '@/hooks/use-checklists';

const templateStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  active: { label: 'Active', variant: 'success' },
  archived: { label: 'Archived', variant: 'default' },
};

const categoryLabels: Record<string, string> = {
  safety: 'Safety',
  quality: 'Quality',
  compliance: 'Compliance',
  training: 'Training',
  operational: 'Operational',
};

export default function ChecklistsPage() {
  const { toast } = useToast();

  // Queries
  const { data: templates, isLoading: templatesLoading, error: templatesError } = useChecklistTemplates();
  const { data: responsesData, isLoading: responsesLoading } = useChecklistResponses({ limit: 50 });
  const { data: stats } = useChecklistStats();

  // Mutations
  const activateTemplate = useActivateChecklistTemplate();
  const archiveTemplate = useArchiveChecklistTemplate();

  const responses = responsesData?.data || [];

  const handleActivateTemplate = async (templateId: string) => {
    try {
      await activateTemplate.mutateAsync(templateId);
      toast({ title: 'Success', description: 'Template activated' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to activate template',
        variant: 'destructive',
      });
    }
  };

  const handleArchiveTemplate = async (templateId: string) => {
    try {
      await archiveTemplate.mutateAsync(templateId);
      toast({ title: 'Success', description: 'Template archived' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to archive template',
        variant: 'destructive',
      });
    }
  };

  if (templatesError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load checklists</p>
          <p className="text-sm text-muted-foreground">
            {(templatesError as any)?.message || 'Please try again later'}
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
          <h1 className="text-3xl font-bold tracking-tight">Checklists</h1>
          <p className="text-muted-foreground">
            Manage safety, quality, and compliance checklists
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeTemplates ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedToday ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inProgress ?? 0}</div>
          </CardContent>
        </Card>
        <Card className={(stats?.blocked ?? 0) > 0 ? 'border-red-300 bg-red-50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {(stats?.blocked ?? 0) > 0 && (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              Blocked Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.blocked ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="responses">
        <TabsList>
          <TabsTrigger value="responses">Recent Responses</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="responses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Checklist Responses</CardTitle>
              <CardDescription>Completed and in-progress checklists</CardDescription>
            </CardHeader>
            <CardContent>
              {responsesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Respondent</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.length > 0 ? (
                      responses.map((response) => {
                        const totalItems = response.answers?.length || 0;
                        const passedItems = response.answers?.filter((a) => a.passed === true).length || 0;
                        const failedItems = response.answers?.filter((a) => a.passed === false).length || 0;
                        const answeredItems = passedItems + failedItems;

                        return (
                          <TableRow key={response.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{response.template?.name || 'Unknown'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {response.entityType}: {response.entityId}
                            </TableCell>
                            <TableCell>
                              {response.respondent?.firstName} {response.respondent?.lastName}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-green-500 rounded-full"
                                    style={{
                                      width: totalItems > 0 ? `${(answeredItems / totalItems) * 100}%` : '0%',
                                    }}
                                  />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {answeredItems}/{totalItems}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {response.status === 'completed' ? (
                                response.passed ? (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Passed</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-red-600">
                                    <XCircle className="h-4 w-4" />
                                    <span>Failed</span>
                                    {response.blocked && (
                                      <Badge variant="destructive" className="ml-1">
                                        Blocked
                                      </Badge>
                                    )}
                                  </div>
                                )
                              ) : (
                                <Badge variant="secondary">In Progress</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {response.completedAt ? formatDateTime(response.completedAt) : '-'}
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
                                  {response.status === 'in_progress' && (
                                    <DropdownMenuItem>Continue</DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem>Download PDF</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No responses found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Checklist Templates</CardTitle>
              <CardDescription>Configure reusable checklist templates</CardDescription>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates && templates.length > 0 ? (
                      templates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{template.name}</p>
                              {template.description && (
                                <p className="text-sm text-muted-foreground">{template.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {categoryLabels[template.category] || template.category}
                            </Badge>
                          </TableCell>
                          <TableCell>{template.items?.length || 0} items</TableCell>
                          <TableCell>v{template.version}</TableCell>
                          <TableCell>
                            <Badge variant={templateStatusConfig[template.status]?.variant || 'default'}>
                              {templateStatusConfig[template.status]?.label || template.status}
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
                                <DropdownMenuItem>Edit Template</DropdownMenuItem>
                                <DropdownMenuItem>View Items</DropdownMenuItem>
                                {template.status === 'draft' && (
                                  <DropdownMenuItem onClick={() => handleActivateTemplate(template.id)}>
                                    Activate
                                  </DropdownMenuItem>
                                )}
                                {template.status === 'active' && (
                                  <DropdownMenuItem onClick={() => handleArchiveTemplate(template.id)}>
                                    Archive
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                {template.status === 'draft' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive">
                                      Delete
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No templates found
                        </TableCell>
                      </TableRow>
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
