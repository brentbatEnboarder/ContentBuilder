import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useCustomer, Customer } from '@/contexts/CustomerContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function CustomerSelection() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { customers, loading, error, selectCustomer, createCustomer } = useCustomer();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">ContentBuilder</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Select Customer</h2>
            <p className="text-muted-foreground">
              Choose a customer to work with, or create a new one.
              <br />
              <span className="text-sm">Each customer has their own pages, brand settings, and content.</span>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Customer List */}
          {customers.length > 0 ? (
            <div className="grid gap-3 mb-6">
              {customers.map((customer) => (
                <Card
                  key={customer.id}
                  className="p-4 cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-colors"
                  onClick={() => handleSelect(customer)}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(customer.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="mb-6 p-8 text-center border border-dashed border-border rounded-lg">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No customers yet</p>
              <p className="text-sm text-muted-foreground">Create your first customer to get started</p>
            </div>
          )}

          {/* Create New Customer */}
          {showCreate ? (
            <Card className="p-4">
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Customer Name</label>
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter customer name..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    autoFocus
                    className="flex-1"
                  />
                  <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                  </Button>
                  <Button variant="ghost" onClick={() => { setShowCreate(false); setNewName(''); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Button
              variant="outline"
              className="w-full h-12"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Customer
            </Button>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-4">
        <p className="text-center text-sm text-muted-foreground">
          To switch customers, sign out and sign back in.
        </p>
      </footer>
    </div>
  );
}
