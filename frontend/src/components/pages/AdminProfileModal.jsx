import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { apiPut } from '../../utils/apiUtils';
import { ArrowLeft } from 'lucide-react';

// A reusable form row component
const FormRow = ({ label, id, children }) => (
  <div className="grid grid-cols-4 items-center gap-4">
    <Label htmlFor={id} className="text-right">
      {label}
    </Label>
    <div className="col-span-3">{children}</div>
  </div>
);

export function AdminProfileModal({ isOpen, onClose }) {
  const { state, dispatch, ActionTypes } = useApp();
  const [view, setView] = useState('selection'); // 'selection', 'name', 'password', 'otp', 'username'
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    otp_code: '',
    current_password: '',
    password: '',
    password_confirmation: '',
    new_otp_code: '',
    new_otp_code_confirmation: '',
    new_username: '',
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: state.currentUser?.name || '',
        otp_code: '',
        current_password: '',
        password: '',
        password_confirmation: '',
        new_otp_code: '',
        new_otp_code_confirmation: '',
        new_username: '',
      });
      // If modal is closed, reset view back to the selection screen
      return () => setView('selection');
    }
  }, [isOpen, state.currentUser]); // ✅ THE FIX IS HERE: 'view' has been removed from this line

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e, action) => {
    e.preventDefault();
    setIsLoading(true);

    let endpoint = '';
    let payload = {};
    let successMessage = '';

    // Configure API call based on the action
    switch (action) {
      case 'name':
        endpoint = '/profile/change-name';
        payload = { name: formData.name, otp_code: formData.otp_code };
        successMessage = 'Name updated successfully!';
        break;
      case 'password':
        if (formData.password !== formData.password_confirmation) {
            toast.error("New passwords do not match.");
            setIsLoading(false);
            return;
        }
        endpoint = '/profile/change-password';
        payload = { password: formData.password, password_confirmation: formData.password_confirmation, otp_code: formData.otp_code };
        successMessage = 'Password updated successfully!';
        break;
      case 'otp':
        if (formData.new_otp_code !== formData.new_otp_code_confirmation) {
            toast.error("New OTP codes do not match.");
            setIsLoading(false);
            return;
        }
        endpoint = '/profile/change-otp';
        payload = { current_password: formData.current_password, new_otp_code: formData.new_otp_code, new_otp_code_confirmation: formData.new_otp_code_confirmation };
        successMessage = 'OTP updated successfully!';
        break;
      case 'username':
        endpoint = '/profile/change-username';
        payload = { current_password: formData.current_password, otp_code: formData.otp_code, new_username: formData.new_username };
        successMessage = 'Username updated successfully!';
        break;
      default:
        setIsLoading(false);
        return;
    }

    try {
      const response = await apiPut(endpoint, payload, {
        headers: { 'Authorization': `Bearer ${state.token}` }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to update ${action}.`);
      }

      // If name or username was changed, update the global state
      if (data.data && data.data.user) {
        dispatch({ type: ActionTypes.LOGIN, payload: { user: data.data.user, userType: 'admin', token: state.token } });
        localStorage.setItem("user_data", JSON.stringify({ user: data.data.user, userType: "admin" }));
      }
      
      toast.success(successMessage);
      onClose();

    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderContent = () => {
    switch (view) {
      case 'name':
        return (
          <form onSubmit={(e) => handleSubmit(e, 'name')}>
            <DialogHeader>
              <DialogTitle>Change Name</DialogTitle>
              <DialogDescription>Enter your new name and the current 6-digit OTP to confirm.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormRow label="New Name" id="name"><Input id="name" value={formData.name} onChange={handleInputChange} required /></FormRow>
              <FormRow label="6-Digit OTP" id="otp_code">
              <Input id="otp_code" 
              placeholder="Current OTP" 
              type="password" 
              maxLength="6" 
              onChange={handleInputChange} required />
              </FormRow>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setView('selection')}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Name'}</Button>
            </DialogFooter>
          </form>
        );
      case 'password':
        return (
          <form onSubmit={(e) => handleSubmit(e, 'password')}>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>Enter a new password and the current 6-digit OTP to confirm.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormRow label="New Password" id="password"><Input id="password" type="password" onChange={handleInputChange} required /></FormRow>
              <FormRow label="Confirm" id="password_confirmation"><Input id="password_confirmation" type="password" onChange={handleInputChange} required /></FormRow>
              <FormRow label="6-Digit OTP" id="otp_code">
              <Input id="otp_code" 
              placeholder="Current OTP" 
              type="password" 
              maxLength="6" 
              onChange={handleInputChange} required />
              </FormRow>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setView('selection')}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Password'}</Button>
            </DialogFooter>
          </form>
        );
      case 'otp':
        return (
          <form onSubmit={(e) => handleSubmit(e, 'otp')}>
            <DialogHeader>
              <DialogTitle>Change 6-Digit OTP</DialogTitle>
              <DialogDescription>Enter your current password to set a new 6-digit OTP.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormRow label="Current Password" id="current_password">
              <Input id="current_password" 
              placeholder="Current Password" 
              type="password" 
              onChange={handleInputChange} required />
              </FormRow>
              <FormRow label="New OTP" 
              id="new_otp_code">
              <Input id="new_otp_code" 
              placeholder="New 6-digit OTP"
              maxLength="6" 
              onChange={handleInputChange} required />
              </FormRow>
              <FormRow label="Confirm OTP" 
              id="new_otp_code_confirmation">
              <Input id="new_otp_code_confirmation" 
              placeholder="Confirm new OTP" 
              type="password"
              maxLength="6" 
              onChange={handleInputChange} required />
              </FormRow>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setView('selection')}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Set New OTP'}</Button>
            </DialogFooter>
          </form>
        );
      case 'username':
        return (
          <form onSubmit={(e) => handleSubmit(e, 'username')}>
            <DialogHeader>
              <DialogTitle>Change Username</DialogTitle>
              <DialogDescription>Enter your current password and OTP to set a new username.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <FormRow label="New Username" 
                id="new_username">
                <Input id="new_username" 
                onChange={handleInputChange} required />
                </FormRow>
                <FormRow label="Current Password" 
                id="current_password">
                <Input id="current_password" 
                placeholder="Current Password" 
                type="password" 
                onChange={handleInputChange} required />
                </FormRow>
                <FormRow label="6-Digit OTP" id="otp_code">
                <Input id="otp_code" 
                placeholder="Current OTP" 
                type="password"
                maxLength="6" 
                onChange={handleInputChange} required />
                </FormRow>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setView('selection')}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Username'}</Button>
            </DialogFooter>
          </form>
        );
      default: // 'selection' view
        return (
          <>
            <DialogHeader>
              <DialogTitle>Edit Administrator Profile</DialogTitle>
              <DialogDescription>Select an action you want to perform. Each action requires authentication.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <Button onClick={() => setView('name')}>Change Name</Button>
              <Button onClick={() => setView('password')}>Change Password</Button>
              <Button onClick={() => setView('otp')}>Change 6-Digit OTP</Button>
              <Button onClick={() => setView('username')}>Change Username</Button>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </DialogFooter>
          </>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}