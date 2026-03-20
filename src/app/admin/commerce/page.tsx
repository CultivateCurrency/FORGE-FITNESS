"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ShoppingBag,
  DollarSign,
  Heart,
  Package,
  Plus,
  Edit3,
  Trash2,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { useApi } from "@/hooks/use-api";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description: string;
  imageUrl: string | null;
  isActive: boolean;
  tenantId: string;
  _count: { orderItems: number };
}

interface ProductsResponse {
  products: Product[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

interface Donation {
  id: string;
  amount: number;
  message: string | null;
  createdAt: string;
  user: { fullName: string; email: string };
}

interface DonationsResponse {
  data: Donation[];
  stats: { totalAmount: number; monthlyAmount: number; totalCount: number };
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { name: string };
}

interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  user: { id: string; fullName: string; email: string };
  items: OrderItem[];
}

interface OrdersResponse {
  orders: Order[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminCommercePage() {
  const [activeSection, setActiveSection] = useState<"products" | "orders" | "donations">("products");

  const { data, loading, error, refetch: refetchProducts } = useApi<ProductsResponse>("/api/shop/products?limit=50");
  const { data: ordersData, loading: ordersLoading, error: ordersError } = useApi<OrdersResponse>(
    activeSection === "orders" ? "/api/admin/orders?limit=50" : null
  );
  const { data: donationsData, loading: donationsLoading, refetch: refetchDonations } = useApi<DonationsResponse>(
    activeSection === "donations" ? "/api/admin/donations?limit=50" : null
  );

  const orders = ordersData?.orders ?? [];
  const totalRevenue = data?.products.reduce((sum, p) => sum + p.price * p._count.orderItems, 0) ?? 0;

  // Product CRUD
  const [productModal, setProductModal] = useState(false);
  const [productEditing, setProductEditing] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({ name: "", description: "", price: "", stock: "", category: "", imageUrl: "" });
  const [productDeleteConfirm, setProductDeleteConfirm] = useState<string | null>(null);
  const [productSaving, setProductSaving] = useState(false);

  async function saveProduct() {
    setProductSaving(true);
    const payload = {
      name: productForm.name,
      description: productForm.description || null,
      price: parseFloat(productForm.price) || 0,
      stock: parseInt(productForm.stock) || 0,
      category: productForm.category || null,
      imageUrl: productForm.imageUrl || null,
    };
    if (productEditing) {
      await fetch(`/api/shop/products/${productEditing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      await fetch("/api/shop/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setProductSaving(false);
    setProductModal(false);
    setProductEditing(null);
    refetchProducts();
  }

  async function deleteProduct(id: string) {
    await fetch(`/api/shop/products/${id}`, { method: "DELETE" });
    setProductDeleteConfirm(null);
    refetchProducts();
  }

  const donations = donationsData?.data || [];
  const donationStats = donationsData?.stats;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Commerce Management</h1>
        <p className="text-zinc-400 mt-1">Manage products, orders, donations, and revenue.</p>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/20 to-zinc-900 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">${totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-zinc-400">Total Revenue</p>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-xs text-green-400">
              <ArrowUpRight className="h-3 w-3" />
              <span>+14% from last month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Package className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{ordersData?.pagination.total ?? 0}</p>
                <p className="text-sm text-zinc-400">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <ShoppingBag className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{data?.pagination.total ?? 0}</p>
                <p className="text-sm text-zinc-400">Active Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-500/20">
                <Heart className="h-6 w-6 text-pink-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {donationStats ? formatCurrency(donationStats.monthlyAmount) : "$0"}
                </p>
                <p className="text-sm text-zinc-400">Donations (MTD)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2">
        {(["products", "orders", "donations"] as const).map((section) => (
          <Button
            key={section}
            variant={activeSection === section ? "default" : "outline"}
            onClick={() => setActiveSection(section)}
            className={
              activeSection === section
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            }
          >
            {section.charAt(0).toUpperCase() + section.slice(1)}
          </Button>
        ))}
      </div>

      {/* Products */}
      {activeSection === "products" && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-orange-500" />
                Merchandise (Products For Sale)
              </CardTitle>
              <Button
                onClick={() => { setProductEditing(null); setProductForm({ name: "", description: "", price: "", stock: "", category: "", imageUrl: "" }); setProductModal(true); }}
                className="bg-orange-500 hover:bg-orange-600 text-white" size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />Add Product
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex items-center justify-center py-12 gap-3 text-zinc-400">
                <Loader2 className="h-5 w-5 animate-spin" /><span>Loading products...</span>
              </div>
            )}
            {error && <div className="flex items-center justify-center py-12 text-red-400">Failed to load products.</div>}
            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase">Product</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase">Price</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase">Stock</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase">Sold</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase">Status</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-zinc-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.products ?? []).map((product) => {
                      const status = product.stock === 0 ? "Out of Stock" : product.stock < 20 ? "Low Stock" : "Active";
                      return (
                        <tr key={product.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition">
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm font-medium text-white">{product.name}</p>
                              <p className="text-xs text-zinc-500">{product.category}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-zinc-300">${product.price.toFixed(2)}</td>
                          <td className="py-3 px-4 text-sm text-zinc-300">{product.stock}</td>
                          <td className="py-3 px-4 text-sm text-zinc-300">{product._count.orderItems}</td>
                          <td className="py-3 px-4">
                            <Badge
                              className={
                                status === "Active" ? "bg-green-500/20 text-green-400 border-green-500/30"
                                  : status === "Out of Stock" ? "bg-red-500/20 text-red-400 border-red-500/30"
                                  : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                              }
                            >
                              {status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline" size="sm"
                                onClick={() => { setProductEditing(product); setProductForm({ name: product.name, description: product.description || "", price: String(product.price), stock: String(product.stock), category: product.category || "", imageUrl: product.imageUrl || "" }); setProductModal(true); }}
                                className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline" size="sm"
                                onClick={() => setProductDeleteConfirm(product.id)}
                                className="border-zinc-700 text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {(data?.products ?? []).length === 0 && (
                      <tr><td colSpan={6} className="py-12 text-center text-zinc-500">No products found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Orders */}
      {activeSection === "orders" && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ordersLoading && (
              <div className="flex items-center justify-center py-12 gap-3 text-zinc-400">
                <Loader2 className="h-5 w-5 animate-spin" /><span>Loading orders...</span>
              </div>
            )}
            {ordersError && (
              <div className="flex items-center justify-center py-12 text-red-400">Failed to load orders.</div>
            )}
            {!ordersLoading && !ordersError && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase">Order ID</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase">Customer</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase">Items</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase">Total</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => {
                      const statusLabel = order.status.charAt(0) + order.status.slice(1).toLowerCase();
                      return (
                        <tr key={order.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition">
                          <td className="py-3 px-4 text-sm font-mono text-zinc-400">{order.id.slice(0, 12)}</td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm text-white">{order.user.fullName}</p>
                              <p className="text-xs text-zinc-500">{order.user.email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-zinc-300">{order.items.length}</td>
                          <td className="py-3 px-4 text-sm font-medium text-green-400">{formatCurrency(order.total)}</td>
                          <td className="py-3 px-4">
                            <Badge className={
                              order.status === "DELIVERED" ? "bg-green-500/20 text-green-400"
                                : order.status === "SHIPPED" ? "bg-blue-500/20 text-blue-400"
                                : order.status === "CANCELLED" || order.status === "REFUNDED" ? "bg-red-500/20 text-red-400"
                                : order.status === "PAID" ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-amber-500/20 text-amber-400"
                            }>{statusLabel}</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-zinc-400">{formatDate(order.createdAt)}</td>
                        </tr>
                      );
                    })}
                    {orders.length === 0 && (
                      <tr><td colSpan={6} className="py-12 text-center text-zinc-500">No orders found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Donations */}
      {activeSection === "donations" && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-500" />
                  Donations
                </CardTitle>
                <CardDescription className="text-zinc-400 mt-1">
                  Viewer donations and tips to coaches.
                </CardDescription>
              </div>
              {donationStats && (
                <div className="flex gap-4 text-right">
                  <div>
                    <p className="text-xs text-zinc-500">Total All Time</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(donationStats.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">This Month</p>
                    <p className="text-lg font-bold text-pink-400">{formatCurrency(donationStats.monthlyAmount)}</p>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {donationsLoading && (
              <div className="flex items-center gap-2 text-zinc-400 py-8">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading donations...
              </div>
            )}
            {!donationsLoading && donations.length === 0 && (
              <p className="text-center text-zinc-500 py-8">No donations yet.</p>
            )}
            <div className="space-y-3">
              {donations.map((donation) => (
                <div key={donation.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-800">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-pink-500/10">
                      <Heart className="h-5 w-5 text-pink-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{donation.user.fullName}</span>
                        <span className="text-xs text-zinc-500">{donation.user.email}</span>
                      </div>
                      {donation.message && (
                        <p className="text-xs text-zinc-400 mt-1 italic">&quot;{donation.message}&quot;</p>
                      )}
                      <p className="text-xs text-zinc-500 mt-1">{formatDate(donation.createdAt)}</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-green-400">{formatCurrency(donation.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Add/Edit Modal */}
      <Dialog open={productModal} onOpenChange={setProductModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{productEditing ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product Name *</Label>
              <Input className="bg-zinc-800 border-zinc-700 text-white mt-1" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} placeholder="e.g. Gymtality T-Shirt" />
            </div>
            <div>
              <Label>Description</Label>
              <Input className="bg-zinc-800 border-zinc-700 text-white mt-1" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} placeholder="Product description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price ($) *</Label>
                <Input type="number" step="0.01" className="bg-zinc-800 border-zinc-700 text-white mt-1" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} placeholder="29.99" />
              </div>
              <div>
                <Label>Stock *</Label>
                <Input type="number" className="bg-zinc-800 border-zinc-700 text-white mt-1" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: e.target.value })} placeholder="100" />
              </div>
            </div>
            <div>
              <Label>Category</Label>
              <Input className="bg-zinc-800 border-zinc-700 text-white mt-1" value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} placeholder="e.g. Apparel, Supplements" />
            </div>
            <div>
              <Label>Product Image (URL)</Label>
              <Input className="bg-zinc-800 border-zinc-700 text-white mt-1" value={productForm.imageUrl} onChange={e => setProductForm({ ...productForm, imageUrl: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setProductModal(false)} className="text-zinc-400">Cancel</Button>
            <Button onClick={saveProduct} disabled={!productForm.name || !productForm.price || productSaving} className="bg-orange-500 hover:bg-orange-600 text-white">
              {productSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {productEditing ? "Save Changes" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Delete Confirm */}
      <Dialog open={!!productDeleteConfirm} onOpenChange={() => setProductDeleteConfirm(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader><DialogTitle>Delete Product</DialogTitle></DialogHeader>
          <p className="text-zinc-400">Delete this product? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setProductDeleteConfirm(null)} className="text-zinc-400">Cancel</Button>
            <Button onClick={() => productDeleteConfirm && deleteProduct(productDeleteConfirm)} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
