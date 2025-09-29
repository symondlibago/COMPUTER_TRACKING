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
import { apiPut } from '../../utils/apiUtils'; // MODIFICATION: Import the apiPut utility

export function AdminProfileModal({ isOpen, onClose }) {
  const { state, dispatch, ActionTypes } = useApp();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Pre-fill the form with the current user's name
  useEffect(() => {
    if (state.currentUser) {
      setName(state.currentUser.name);
    }
  }, [state.currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password && password !== passwordConfirmation) {
      toast.error("Passwords do not match.");
      return;
    }
    setIsLoading(true);

    try {
      // MODIFICATION: The API call is now cleaner using the apiPut utility
      const payload = {
        name: name,
        // Conditionally add password fields to the payload only if the password is being changed
        ...(password && { password: password, password_confirmation: passwordConfirmation }),
      };

      const response = await apiPut('/profile', payload, {
        headers: { 'Authorization': `Bearer ${state.token}` }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile.');
      }

      // Update user in global state and close modal
      dispatch({ type: ActionTypes.SET_USER, payload: data.data.user });
      toast.success('Profile updated successfully!');
      onClose();

    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Administrator Profile</DialogTitle>
          <DialogDescription>
            Update your name and password here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                New Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Leave blank to keep current"
                onChange={(e) => setPassword(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password_confirmation" className="text-right">
                Confirm
              </Label>
              <Input
                id="password_confirmation"
                type="password"
                placeholder="Confirm new password"
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}