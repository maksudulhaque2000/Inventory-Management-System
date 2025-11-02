'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Plus, Download, DollarSign, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

interface Sale {
  _id: string;
  product: {
    _id: string;
    name: string;
    imageUrl: string;
  };
  customer: {
    _id: string;
    name: string;
    mobileNumber: string;
    address: string;
  };
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  cashReceived: number;
  remainingAmount: number;
  paymentStatus: 'paid' | 'partial' | 'pending';
  saleDate: string;
}

interface Product {
  _id: string;
  name: string;
  quantity: number;
  sellingPrice: number;
}

interface Customer {
  _id: string;
  name: string;
  mobileNumber: string;
}

interface UserProfile {
  companyName?: string;
  name?: string;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isCreateCustomerDialogOpen, setIsCreateCustomerDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    productId: '',
    customerId: '',
    customerSearch: '',
    quantity: 1,
    unitPrice: 0,
    cashReceived: 0,
  });

  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    mobileNumber: '',
    address: '',
    imageUrl: '',
  });

  const [paymentData, setPaymentData] = useState({
    additionalPayment: 0,
  });

  useEffect(() => {
    fetchSales();
    fetchProducts();
    fetchCustomers();
    fetchUserProfile();
  }, [page]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const fetchSales = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/sales?page=${page}&limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSales(data.sales);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      toast.error('Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/products', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
      }
    } catch (error) {
      toast.error('Failed to fetch products');
    }
  };

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/customers?limit=1000', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers);
        setFilteredCustomers(data.customers);
      }
    } catch (error) {
      toast.error('Failed to fetch customers');
    }
  };

  const handleCustomerSearch = (search: string) => {
    setFormData({ ...formData, customerSearch: search });
    if (search) {
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(search.toLowerCase()) ||
          customer.mobileNumber.includes(search)
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCustomerData.name || !newCustomerData.mobileNumber || !newCustomerData.address) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCustomerData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Customer created successfully');
        setNewCustomerData({ name: '', mobileNumber: '', address: '', imageUrl: '' });
        setIsCreateCustomerDialogOpen(false);
        await fetchCustomers();
        // Auto-select the newly created customer
        setFormData({
          ...formData,
          customerId: data.customer._id,
          customerSearch: data.customer.name,
        });
      } else {
        toast.error(data.error || 'Failed to create customer');
      }
    } catch (error) {
      toast.error('Failed to create customer');
    }
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find((p) => p._id === productId);
    if (product) {
      setFormData({
        ...formData,
        productId,
        unitPrice: product.sellingPrice,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerId) {
      toast.error('Please select or create a customer');
      return;
    }

    const product = products.find((p) => p._id === formData.productId);
    if (!product) {
      toast.error('Please select a product');
      return;
    }

    if (product.quantity < formData.quantity) {
      toast.error('Insufficient stock');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: formData.productId,
          customerId: formData.customerId,
          quantity: formData.quantity,
          unitPrice: formData.unitPrice,
          cashReceived: formData.cashReceived,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Sale created successfully');
        setIsDialogOpen(false);
        resetForm();
        fetchSales();
        fetchProducts();
      } else {
        toast.error(data.error || 'Failed to create sale');
      }
    } catch (error) {
      toast.error('Failed to create sale');
    }
  };

  const handlePaymentUpdate = async () => {
    if (!selectedSale || paymentData.additionalPayment <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/sales/${selectedSale._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          additionalPayment: paymentData.additionalPayment,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Payment updated successfully');
        setIsPaymentDialogOpen(false);
        setPaymentData({ additionalPayment: 0 });
        fetchSales();
      } else {
        toast.error(data.error || 'Failed to update payment');
      }
    } catch (error) {
      toast.error('Failed to update payment');
    }
  };

  const downloadInvoice = async (sale: Sale) => {
    try {
      const companyName = userProfile?.companyName || userProfile?.name || 'Company Name';
      
      const pdf = new jsPDF();
      
      // Set font
      pdf.setFontSize(20);
      pdf.text('INVOICE', 105, 20, { align: 'center' });
      
      // Company name
      pdf.setFontSize(14);
      pdf.text(companyName, 105, 30, { align: 'center' });
      
      // Invoice details
      pdf.setFontSize(10);
      pdf.text(`Date: ${new Date(sale.saleDate).toLocaleDateString()}`, 14, 45);
      pdf.text(`Invoice #: ${sale._id.substring(0, 8)}`, 14, 52);
      
      // Customer details
      pdf.setFontSize(12);
      pdf.text('Customer Details:', 14, 65);
      pdf.setFontSize(10);
      pdf.text(`Name: ${sale.customer?.name || 'Unknown Customer'}`, 14, 72);
      pdf.text(`Mobile: ${sale.customer?.mobileNumber || 'N/A'}`, 14, 79);
      pdf.text(`Address: ${sale.customer?.address || 'N/A'}`, 14, 86);
      
      // Product details
      pdf.setFontSize(12);
      pdf.text('Product Details:', 14, 100);
      pdf.setFontSize(10);
      pdf.text(`Product: ${sale.product?.name || 'Deleted Product'}`, 14, 107);
      pdf.text(`Quantity: ${sale.quantity}`, 14, 114);
      pdf.text(`Unit Price: ${formatCurrency(sale.unitPrice)}`, 14, 121);
      pdf.text(`Total Amount: ${formatCurrency(sale.totalAmount)}`, 14, 128);
      
      // Payment details
      pdf.setFontSize(12);
      pdf.text('Payment Details:', 14, 145);
      pdf.setFontSize(10);
      pdf.text(`Cash Received: ${formatCurrency(sale.cashReceived)}`, 14, 152);
      pdf.text(`Remaining: ${formatCurrency(sale.remainingAmount)}`, 14, 159);
      pdf.text(`Status: ${sale.paymentStatus.toUpperCase()}`, 14, 166);
      
      pdf.save(`invoice-${sale._id.substring(0, 8)}.pdf`);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Invoice generation error:', error);
      toast.error('Failed to generate invoice');
    }
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      customerId: '',
      customerSearch: '',
      quantity: 1,
      unitPrice: 0,
      cashReceived: 0,
    });
    setFilteredCustomers(customers);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500">Partial</Badge>;
      case 'pending':
        return <Badge className="bg-red-500">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales</h1>
          <p className="text-muted-foreground">Manage your sales and payments</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Sale</DialogTitle>
              <DialogDescription>Record a new sale transaction</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="customerSearch">Search Customer</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateCustomerDialogOpen(true)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add New Customer
                  </Button>
                </div>
                <Input
                  id="customerSearch"
                  placeholder="Type customer name or mobile number..."
                  value={formData.customerSearch}
                  onChange={(e) => handleCustomerSearch(e.target.value)}
                />
                {formData.customerSearch && filteredCustomers.length > 0 && (
                  <div className="border rounded-md max-h-40 overflow-y-auto">
                    {filteredCustomers.slice(0, 5).map((customer) => (
                      <div
                        key={customer._id}
                        className="p-2 hover:bg-muted cursor-pointer"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            customerId: customer._id,
                            customerSearch: customer.name,
                          });
                          setFilteredCustomers([]);
                        }}
                      >
                        {customer.name} - {customer.mobileNumber}
                      </div>
                    ))}
                  </div>
                )}
                {formData.customerSearch && filteredCustomers.length === 0 && (
                  <div className="text-sm text-muted-foreground p-2">
                    No customer found. Click &quot;Add New Customer&quot; to create one.
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="productId">Product</Label>
                <Select
                  value={formData.productId}
                  onValueChange={handleProductSelect}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem
                        key={product._id}
                        value={product._id}
                        disabled={product.quantity === 0}
                      >
                        {product.name} ({product.quantity} in stock)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unitPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cashReceived">Cash Received</Label>
                <Input
                  id="cashReceived"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cashReceived}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cashReceived: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Total: {formatCurrency(formData.quantity * formData.unitPrice)}
                  {formData.cashReceived > 0 && (
                    <span className="ml-2">
                      | Remaining:{' '}
                      {formatCurrency(
                        formData.quantity * formData.unitPrice - formData.cashReceived
                      )}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Sale</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-12 w-24" />
                </div>
              ))}
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sales found. Create your first sale to get started.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Cash Received</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale._id}>
                      <TableCell>
                        {new Date(sale.saleDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{sale.product?.name || 'Deleted Product'}</TableCell>
                      <TableCell>{sale.customer?.name || 'Unknown Customer'}</TableCell>
                      <TableCell>{sale.quantity}</TableCell>
                      <TableCell>{formatCurrency(sale.totalAmount)}</TableCell>
                      <TableCell>{formatCurrency(sale.cashReceived)}</TableCell>
                      <TableCell>{formatCurrency(sale.remainingAmount)}</TableCell>
                      <TableCell>{getPaymentStatusBadge(sale.paymentStatus)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {sale.remainingAmount > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedSale(sale);
                                setIsPaymentDialogOpen(true);
                              }}
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadInvoice(sale)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateCustomerDialogOpen} onOpenChange={setIsCreateCustomerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Create a new customer to proceed with the sale
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCustomer} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newCustomerName">Customer Name *</Label>
              <Input
                id="newCustomerName"
                value={newCustomerData.name}
                onChange={(e) =>
                  setNewCustomerData({ ...newCustomerData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newCustomerMobile">Mobile Number *</Label>
              <Input
                id="newCustomerMobile"
                value={newCustomerData.mobileNumber}
                onChange={(e) =>
                  setNewCustomerData({ ...newCustomerData, mobileNumber: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newCustomerAddress">Address *</Label>
              <Input
                id="newCustomerAddress"
                value={newCustomerData.address}
                onChange={(e) =>
                  setNewCustomerData({ ...newCustomerData, address: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newCustomerImageUrl">Image URL (Optional)</Label>
              <Input
                id="newCustomerImageUrl"
                value={newCustomerData.imageUrl}
                onChange={(e) =>
                  setNewCustomerData({ ...newCustomerData, imageUrl: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateCustomerDialogOpen(false);
                  setNewCustomerData({ name: '', mobileNumber: '', address: '', imageUrl: '' });
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Create Customer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payment</DialogTitle>
            <DialogDescription>
              Add payment for: {selectedSale?.customer?.name || 'Unknown Customer'}
            </DialogDescription>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Amount: {formatCurrency(selectedSale.totalAmount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Cash Received: {formatCurrency(selectedSale.cashReceived)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Remaining: {formatCurrency(selectedSale.remainingAmount)}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="additionalPayment">Additional Payment</Label>
                <Input
                  id="additionalPayment"
                  type="number"
                  min="0"
                  max={selectedSale.remainingAmount}
                  step="0.01"
                  value={paymentData.additionalPayment}
                  onChange={(e) =>
                    setPaymentData({
                      additionalPayment: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                {paymentData.additionalPayment > 0 && (
                  <p className="text-sm text-muted-foreground">
                    New Remaining:{' '}
                    {formatCurrency(
                      selectedSale.remainingAmount - paymentData.additionalPayment
                    )}
                  </p>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsPaymentDialogOpen(false);
                    setPaymentData({ additionalPayment: 0 });
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handlePaymentUpdate}>Update Payment</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
