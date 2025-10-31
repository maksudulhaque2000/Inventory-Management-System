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
import { Plus, Download, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [graphData, setGraphData] = useState<any>(null);

  const [formData, setFormData] = useState({
    productId: '',
    customerId: '',
    customerSearch: '',
    quantity: 1,
    unitPrice: 0,
    cashReceived: 0,
  });

  const [paymentData, setPaymentData] = useState({
    additionalPayment: 0,
  });

  useEffect(() => {
    fetchSales();
    fetchProducts();
    fetchCustomers();
    fetchGraphData();
  }, [page]);

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

  const fetchGraphData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dashboard/sales-graph', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGraphData(data);
      }
    } catch (error) {
      console.error('Failed to fetch graph data:', error);
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
        fetchGraphData();
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
      const invoiceContent = document.createElement('div');
      invoiceContent.style.padding = '20px';
      invoiceContent.style.backgroundColor = 'white';
      invoiceContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 24px; margin: 0;">Invoice</h1>
        </div>
        <div style="margin-bottom: 20px;">
          <p><strong>Date:</strong> ${new Date(sale.saleDate).toLocaleDateString()}</p>
          <p><strong>Invoice #:</strong> ${sale._id}</p>
        </div>
        <div style="margin-bottom: 20px;">
          <h3>Customer Details:</h3>
          <p><strong>Name:</strong> ${sale.customer.name}</p>
          <p><strong>Mobile:</strong> ${sale.customer.mobileNumber}</p>
          <p><strong>Address:</strong> ${sale.customer.address}</p>
        </div>
        <div style="margin-bottom: 20px;">
          <h3>Product Details:</h3>
          <p><strong>Product:</strong> ${sale.product.name}</p>
          <p><strong>Quantity:</strong> ${sale.quantity}</p>
          <p><strong>Unit Price:</strong> ${formatCurrency(sale.unitPrice)}</p>
          <p><strong>Total Amount:</strong> ${formatCurrency(sale.totalAmount)}</p>
        </div>
        <div style="margin-bottom: 20px;">
          <h3>Payment Details:</h3>
          <p><strong>Cash Received:</strong> ${formatCurrency(sale.cashReceived)}</p>
          <p><strong>Remaining:</strong> ${formatCurrency(sale.remainingAmount)}</p>
          <p><strong>Status:</strong> ${sale.paymentStatus}</p>
        </div>
      `;

      document.body.appendChild(invoiceContent);

      const canvas = await html2canvas(invoiceContent);
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF();
      const imgWidth = 190;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`invoice-${sale._id}.pdf`);
      document.body.removeChild(invoiceContent);
    } catch (error) {
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
                <Label htmlFor="customerSearch">Search Customer</Label>
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

      {graphData && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Daily Sales (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={graphData.daily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Monthly Sales (This Year)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={graphData.monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Yearly Sales (Last 5 Years)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={graphData.yearly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="amount" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Sales List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
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
                      <TableCell>{sale.product.name}</TableCell>
                      <TableCell>{sale.customer.name}</TableCell>
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

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payment</DialogTitle>
            <DialogDescription>
              Add payment for: {selectedSale?.customer.name}
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

