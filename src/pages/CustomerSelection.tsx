import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, Loader2, LogOut, Trash2, Search, Sparkles, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCustomer, Customer } from '@/contexts/CustomerContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type SortOption = 'name-asc' | 'name-desc' | 'newest' | 'oldest';

export function CustomerSelection() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { customers, loading, error, selectCustomer, createCustomer, deleteCustomer } = useCustomer();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [customerLogos, setCustomerLogos] = useState<Record<string, string | null>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(query));
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [customers, searchQuery, sortBy]);

  // Fetch logos for all customers from customer_settings
  useEffect(() => {
    if (customers.length === 0) return;

    const fetchLogos = async () => {
      const customerIds = customers.map((c) => c.id);
      const { data } = await supabase
        .from('customer_settings')
        .select('customer_id, company_info')
        .in('customer_id', customerIds);

      if (data) {
        const logos: Record<string, string | null> = {};
        data.forEach((row) => {
          const companyInfo = row.company_info as { logo?: string | null } | null;
          logos[row.customer_id] = companyInfo?.logo || null;
        });
        setCustomerLogos(logos);
      }
    };

    fetchLogos();
  }, [customers]);

  const handleSelect = (customer: Customer) => {
    selectCustomer(customer);
    toast.success(`Working with ${customer.name}`);
    navigate('/');
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;

    setCreating(true);
    const customer = await createCustomer(newName.trim());
    setCreating(false);

    if (customer) {
      toast.success(`Created "${customer.name}"`);
      selectCustomer(customer);
      navigate('/');
    } else {
      toast.error('Failed to create customer');
    }

    setNewName('');
    setShowCreate(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;

    setDeleting(true);
    const success = await deleteCustomer(customerToDelete.id);
    setDeleting(false);
    setCustomerToDelete(null);

    if (success) {
      toast.success(`Deleted "${customerToDelete.name}"`);
    } else {
      toast.error('Failed to delete customer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-purple-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <Loader2 className="relative h-10 w-10 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground font-medium">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 flex flex-col">
      {/* Header - matches TopHeader style */}
      <header className="h-16 bg-card border-b border-border flex items-center px-4 shrink-0">
        {/* Left side - Logo */}
        <div className="flex items-center w-48 shrink-0">
          <img
            src="/ACGLogo.png"
            alt="AI Content Generator"
            className="h-12 w-auto"
          />
        </div>

        {/* Center - Title */}
        <div className="flex-1 flex justify-center">
          <div className="text-center">
            <h1 className="text-lg font-semibold text-foreground leading-tight">
              Select a Customer
            </h1>
            <p className="text-sm text-muted-foreground leading-tight">
              Choose a customer workspace to continue
            </p>
          </div>
        </div>

        {/* Right side - User info */}
        <div className="w-48 shrink-0 flex justify-end items-center gap-4">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-5">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-white border-border/50 rounded-lg shadow-sm focus:border-primary/50 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-[160px] h-10 bg-white border-border/50 rounded-lg shadow-sm">
                <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
              </SelectContent>
            </Select>

            {/* Create Button */}
            <Button
              onClick={() => setShowCreate(true)}
              className="h-10 px-4 rounded-lg shadow-sm"
              disabled={showCreate}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Customer
            </Button>
          </div>

          {/* Create New Customer Form */}
          {showCreate && (
            <Card className="p-5 bg-white border-primary/30 shadow-lg shadow-primary/5 rounded-xl mb-5">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                  <label className="text-sm font-semibold text-foreground">New Customer</label>
                </div>
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter customer name..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    autoFocus
                    className="flex-1 h-11 rounded-lg focus:border-primary/50 focus:ring-primary/20"
                  />
                  <Button
                    onClick={handleCreate}
                    disabled={creating || !newName.trim()}
                    className="h-11 px-5 rounded-lg transition-colors"
                  >
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => { setShowCreate(false); setNewName(''); }}
                    className="h-11 rounded-lg"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Customer List */}
          {customers.length > 0 ? (
            <div className="grid gap-3 mb-6">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <Card
                    key={customer.id}
                    className="relative p-5 cursor-pointer bg-white border-border/50 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 group overflow-hidden rounded-xl"
                    onClick={() => handleSelect(customer)}
                  >
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/[0.02] to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="relative flex items-center gap-4">
                      {customerLogos[customer.id] ? (
                        <div className="h-14 w-14 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 overflow-hidden ring-1 ring-border/50 group-hover:ring-primary/30 transition-all">
                          <img
                            src={customerLogos[customer.id]!}
                            alt={`${customer.name} logo`}
                            className="h-full w-full object-contain p-1"
                          />
                        </div>
                      ) : (
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {customer.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Created {new Date(customer.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-all text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomerToDelete(customer);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-2">
                          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="p-10 text-center border border-dashed border-border rounded-xl bg-slate-50/50">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No customers match "{searchQuery}"</p>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6 p-10 text-center border border-dashed border-border rounded-xl bg-slate-50/50">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 mb-4 ring-1 ring-primary/20">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Welcome!</h3>
              <p className="text-muted-foreground mb-1">No customers yet</p>
              <p className="text-sm text-muted-foreground">Create your first customer to start generating content</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-border/50 bg-white/50">
        <p className="text-center text-sm text-muted-foreground">
          To switch customers later, sign out and sign back in.
        </p>
      </footer>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{customerToDelete?.name}</strong>?
              <br />
              <br />
              This will permanently delete all associated data including pages, brand settings, and content.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
