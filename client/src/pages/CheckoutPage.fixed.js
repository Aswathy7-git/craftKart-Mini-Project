import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { ordersAPI, paymentsAPI } from '../services/api';
import { Truck, Shield, CheckCircle, ArrowLeft, Gift } from 'lucide-react';
import toast from 'react-hot-toast';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal, getGiftTotal, clearCart } = useCart();

  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    // Shipping
    shippingName: '',
    shippingStreet: '',
    shippingCity: '',
    shippingState: '',
    shippingZipCode: '',
    shippingCountry: '',
    shippingPhone: '',
    // Billing
    sameAsShipping: true,
    billingName: '',
    billingStreet: '',
    billingCity: '',
    billingState: '',
    billingZipCode: '',
    billingCountry: '',
    billingPhone: '',
    // Payment
    paymentMethod: 'payu', // 'payu' | 'cod'
    // Notes
    notes: ''
  });

  const cartItems = cart?.items || [];
  const giftItems = cart?.giftItems || [];
  const regularTotal = getCartTotal();
  const giftTotal = getGiftTotal();
  const subtotal = regularTotal + giftTotal;
  const shipping = subtotal > 100 ? 0 : 10;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const steps = [
    { id: 1, name: 'Shipping', icon: Truck },
    { id: 2, name: 'Payment', icon: CheckCircle },
    { id: 3, name: 'Review', icon: CheckCircle }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleNext = () => { if (currentStep < 3) setCurrentStep(currentStep + 1); };
  const handlePrevious = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const isStepValid = (step) => {
    switch (step) {
      case 1:
        return (
          formData.shippingName && formData.shippingStreet && formData.shippingCity &&
          formData.shippingState && formData.shippingZipCode && formData.shippingCountry
        );
      case 2:
        // PayU/COD require no card fields
        return !!formData.paymentMethod;
      default:
        return true;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const itemsPayload = (cart?.items || []).map((it) => ({
        product: it?.product?._id || it?.product,
        quantity: it.quantity
      }));
      const giftPayload = (cart?.giftItems || []).map((it) => ({
        product: it?.product?._id || it?.product,
        quantity: it.quantity,
        recipientName: it.recipientName,
        recipientEmail: it.recipientEmail,
        giftMessage: it.giftMessage
      }));

      const orderPayload = {
        items: [...itemsPayload, ...giftPayload],
        shippingAddress: {
          name: formData.shippingName,
          street: formData.shippingStreet,
          city: formData.shippingCity,
          state: formData.shippingState,
          zipCode: formData.shippingZipCode,
          country: formData.shippingCountry,
          phone: formData.shippingPhone
        },
        billingAddress: formData.sameAsShipping
          ? undefined
          : {
              name: formData.billingName,
              street: formData.billingStreet,
              city: formData.billingCity,
              state: formData.billingState,
              zipCode: formData.billingZipCode,
              country: formData.billingCountry,
              phone: formData.billingPhone
            },
        paymentMethod: { type: formData.paymentMethod || 'cod' },
        gift: {}
      };

      const { data: createResp } = await ordersAPI.createOrder(orderPayload);
      const orderId = createResp?.order?._id;
      if (!orderId) throw new Error('Failed to create order');

      if (formData.paymentMethod === 'payu') {
        const { data: payu } = await paymentsAPI.createPayUOrder(orderId);
        if (!payu?.actionUrl || !payu?.fields) throw new Error('Failed to initiate PayU payment');
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = payu.actionUrl;
        Object.entries(payu.fields).forEach(([k, v]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = k;
          input.value = v;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
        return;
      }

      toast.success('Order confirmed. Pay on delivery.');
      await clearCart();
      navigate('/orders');
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to place order. Please try again.';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0 && giftItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Add some items to your cart before checking out.</p>
            <button onClick={() => navigate('/products')} className="btn-primary">Continue Shopping</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate('/cart')} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Cart</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              {/* Steps */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                        currentStep >= step.id ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300 text-gray-400'
                      }`}>
                        <step.icon className="w-5 h-5" />
                      </div>
                      <div className="ml-3">
                        <div className={`text-sm font-medium ${currentStep >= step.id ? 'text-primary-600' : 'text-gray-500'}`}>
                          {step.name}
                        </div>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`w-16 h-0.5 ml-4 ${currentStep > step.id ? 'bg-primary-600' : 'bg-gray-300'}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 1: Shipping */}
              {currentStep === 1 && (
                <div className="card p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Information</h2>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                        <input type="text" name="shippingName" value={formData.shippingName} onChange={handleInputChange} className="input-field" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                        <input type="tel" name="shippingPhone" value={formData.shippingPhone} onChange={handleInputChange} className="input-field" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
                      <input type="text" name="shippingStreet" value={formData.shippingStreet} onChange={handleInputChange} className="input-field" required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                        <input type="text" name="shippingCity" value={formData.shippingCity} onChange={handleInputChange} className="input-field" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                        <input type="text" name="shippingState" value={formData.shippingState} onChange={handleInputChange} className="input-field" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code *</label>
                        <input type="text" name="shippingZipCode" value={formData.shippingZipCode} onChange={handleInputChange} className="input-field" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                      <select name="shippingCountry" value={formData.shippingCountry} onChange={handleInputChange} className="input-field" required>
                        <option value="">Select Country</option>
                        <option value="IN">India</option>
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="UK">United Kingdom</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="sameAsShipping" name="sameAsShipping" checked={formData.sameAsShipping} onChange={handleInputChange} className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                      <label htmlFor="sameAsShipping" className="ml-2 block text-sm text-gray-700">Billing address is the same as shipping address</label>
                    </div>
                  </div>
                  <div className="flex justify-end mt-8">
                    <button type="button" onClick={handleNext} disabled={!isStepValid(1)} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">Continue to Payment</button>
                  </div>
                </div>
              )}

              {/* Step 2: Payment */}
              {currentStep === 2 && (
                <div className="card p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Information</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* PayU UPI */}
                        <label className={`relative cursor-pointer ${formData.paymentMethod === 'payu' ? 'ring-2 ring-primary-500' : ''}`}>
                          <input type="radio" name="paymentMethod" value="payu" checked={formData.paymentMethod === 'payu'} onChange={handleInputChange} className="sr-only" />
                          <div className={`p-4 border rounded-lg text-center ${formData.paymentMethod === 'payu' ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}`}>
                            <div className="w-8 h-8 mx-auto mb-2 bg-green-600 rounded flex items-center justify-center"><span className="text-white font-bold text-sm">U</span></div>
                            <div className="font-medium">PayU UPI</div>
                          </div>
                        </label>
                        {/* Cash on Delivery */}
                        <label className={`relative cursor-pointer ${formData.paymentMethod === 'cod' ? 'ring-2 ring-primary-500' : ''}`}>
                          <input type="radio" name="paymentMethod" value="cod" checked={formData.paymentMethod === 'cod'} onChange={handleInputChange} className="sr-only" />
                          <div className={`p-4 border rounded-lg text-center ${formData.paymentMethod === 'cod' ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}`}>
                            <div className="w-8 h-8 mx-auto mb-2 bg-gray-700 rounded-full flex items-center justify-center"><span className="text-white font-bold text-sm">₹</span></div>
                            <div className="font-medium">Cash on Delivery</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Shield className="w-4 h-4" />
                        <span>Your payment information is secure and encrypted</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-8">
                    <button type="button" onClick={handlePrevious} className="btn-secondary">Back to Shipping</button>
                    <button type="button" onClick={handleNext} disabled={!isStepValid(2)} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">Review Order</button>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {currentStep === 3 && (
                <div className="card p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Your Order</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Shipping Address</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="font-medium">{formData.shippingName}</p>
                        <p>{formData.shippingStreet}</p>
                        <p>{formData.shippingCity}, {formData.shippingState} {formData.shippingZipCode}</p>
                        <p>{formData.shippingCountry}</p>
                        <p className="text-sm text-gray-600 mt-2">Phone: {formData.shippingPhone}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Payment Method</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="font-medium capitalize">{formData.paymentMethod === 'payu' ? 'PayU UPI' : 'Cash on Delivery'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Order Notes (Optional)</label>
                      <textarea name="notes" value={formData.notes} onChange={handleInputChange} className="input-field" rows={3} placeholder="Any special instructions for your order..." />
                    </div>
                  </div>
                  <div className="flex justify-between mt-8">
                    <button type="button" onClick={handlePrevious} className="btn-secondary">Back to Payment</button>
                    <button type="submit" disabled={isProcessing} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2">
                      {isProcessing ? (<><div className="loading-spinner w-4 h-4" /><span>Processing...</span></>) : (<><CheckCircle className="w-4 h-4" /><span>Place Order</span></>)}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h3>

              {cartItems.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Regular Items</h4>
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item._id} className="flex items-center space-x-3">
                        <img src={item.product.images?.[0]?.url || '/placeholder-product.jpg'} alt={item.product.name} className="w-12 h-12 object-cover rounded" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.product.name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {giftItems.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2"><Gift className="w-4 h-4 text-primary-600" /><span>Gift Items</span></h4>
                  <div className="space-y-3">
                    {giftItems.map((item) => (
                      <div key={item._id} className="flex items-center space-x-3">
                        <img src={item.product.images?.[0]?.url || '/placeholder-product.jpg'} alt={item.product.name} className="w-12 h-12 object-cover rounded" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.product.name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          {item.recipientName && (<p className="text-xs text-primary-600">For: {item.recipientName}</p>)}
                        </div>
                        <p className="text-sm font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-6 border-t border-gray-200">
                <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal</span><span className="font-medium">₹{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Shipping</span><span className="font-medium">{shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Tax</span><span className="font-medium">₹{tax.toFixed(2)}</span></div>
                <div className="border-t border-gray-200 pt-3"><div className="flex justify-between text-lg font-semibold"><span>Total</span><span>₹{total.toFixed(2)}</span></div></div>
              </div>

              <div className="mt-6 flex items-center space-x-2 text-xs text-gray-500">
                <span>Secure checkout with SSL encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
