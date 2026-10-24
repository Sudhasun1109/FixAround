import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authApi, addressesApi, customerApi } from '../../services/api';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Spinner from '../../components/common/Spinner';
import { showToast } from '../../components/common/Toast';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Plus,
  Trash2,
  CheckCircle,
  Home,
  Briefcase,
  Lock,
  Navigation,
} from 'lucide-react';

export default function CustomerProfile() {
  const { user, updateUser } = useAuth();

  // Profile info state
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Address state
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [statesList, setStatesList] = useState([]);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    address_line1: '',
    address_line2: '',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    latitude: null,
    longitude: null,
    is_default: 0,
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Fetch states from dynamic API
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await customerApi.getStates();
        const rawList = res?.data?.states || res?.data || [];
        const list = Array.isArray(rawList)
          ? rawList.map((item) => (typeof item === 'object' && item !== null ? item.name || item.code : String(item)))
          : [];
        if (list.length > 0) {
          setStatesList(list);
          if (!addressForm.state) {
            setAddressForm((prev) => ({ ...prev, state: list[0] }));
          }
        }
      } catch (err) {
        console.warn('Failed to load states from API:', err);
      }
    };
    fetchStates();
  }, []);

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      showToast.error('Geolocation is not supported on this browser');
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setAddressForm((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));

        try {
          // Attempt reverse geocoding via OpenStreetMap Nominatim
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const addr = geoData.address || {};
            const city = addr.city || addr.town || addr.village || addr.suburb || addr.state_district || 'New Delhi';
            const state = addr.state || 'Delhi';
            const postcode = addr.postcode || '';
            const road = [addr.house_number, addr.road, addr.neighbourhood].filter(Boolean).join(', ');

            setAddressForm((prev) => ({
              ...prev,
              city: city || prev.city,
              state: state || prev.state,
              pincode: postcode || prev.pincode,
              address_line1: road || prev.address_line1 || `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
              latitude: lat,
              longitude: lng,
            }));
            showToast.success('Live GPS coordinates & locality detected!');
          } else {
            showToast.success(`Live GPS located: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          }
        } catch {
          showToast.success(`Live GPS located: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } finally {
          setDetectingLocation(false);
        }
      },
      (err) => {
        setDetectingLocation(false);
        showToast.error(`Location detection failed: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const fetchAddresses = useCallback(async () => {
    try {
      setLoadingAddresses(true);
      const res = await addressesApi.getAll();
      const list = res?.data?.addresses || res?.data || [];
      setAddresses(Array.isArray(list) ? list : []);
    } catch {
      setAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Update profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await authApi.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
      });
      updateUser({ first_name: firstName, last_name: lastName, phone });
      showToast.success('Profile details saved.');
    } catch (err) {
      showToast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Add address
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!addressForm.address_line1 || !addressForm.city || !addressForm.pincode) {
      showToast.error('Please fill in line 1, city, and pincode');
      return;
    }

    try {
      setSavingAddress(true);
      await addressesApi.create(addressForm);
      showToast.success('Address added to your profile.');
      setShowAddressModal(false);
      setAddressForm({
        label: 'Home',
        address_line1: '',
        address_line2: '',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
        is_default: 0,
      });
      fetchAddresses();
    } catch (err) {
      showToast.error(err.message || 'Failed to add address');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      await addressesApi.setDefault(addressId);
      showToast.success('Default address updated.');
      fetchAddresses();
    } catch (err) {
      showToast.error(err.message || 'Failed to set default address');
    }
  };

  const handleDeleteAddress = async () => {
    try {
      await addressesApi.delete(deletingAddressId);
      showToast.success('Address removed.');
      setDeletingAddressId(null);
      fetchAddresses();
    } catch (err) {
      showToast.error(err.message || 'Failed to delete address');
    }
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast.error('New passwords do not match');
      return;
    }

    try {
      setChangingPassword(true);
      await authApi.changePassword({
        currentPassword,
        newPassword,
      });
      showToast.success('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast.error(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div>
        <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
          Account Settings
        </span>
        <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
          Profile & Address Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your contact credentials and saved service locations.
        </p>
      </div>

      {/* Personal Info Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-fixblue-900 pb-3 border-b border-slate-100">
          Personal Information
        </h2>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              label="Last Name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address (Login)"
              type="email"
              disabled
              value={user?.email || ''}
              helperText="Email cannot be changed directly."
            />
            <Input
              label="Phone Number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={savingProfile}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Saved Addresses Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-fixblue-900">
              Saved Service Addresses
            </h2>
            <p className="text-xs text-slate-500">
              Quickly pre-fill your doorstep location when booking repairs.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() => setShowAddressModal(true)}
          >
            Add Address
          </Button>
        </div>

        {loadingAddresses ? (
          <Spinner size="md" label="Loading addresses..." className="py-6" />
        ) : addresses.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No saved addresses. Add a home or office location for quick booking.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      {addr.label === 'Home' ? (
                        <Home className="w-3.5 h-3.5 text-fixteal-600" />
                      ) : (
                        <Briefcase className="w-3.5 h-3.5 text-fixblue-800" />
                      )}
                      {addr.label || 'Location'}
                    </span>

                    {Boolean(addr.is_default) && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Default
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {addr.address_line1}
                    {addr.address_line2 && `, ${addr.address_line2}`}
                    <br />
                    {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  {!addr.is_default && (
                    <button
                      type="button"
                      onClick={() => handleSetDefaultAddress(addr.id)}
                      className="text-fixteal-600 font-semibold hover:underline"
                    >
                      Make Default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeletingAddressId(addr.id)}
                    className="text-rose-600 hover:text-rose-700 p-1 ml-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change Password Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-fixblue-900 pb-3 border-b border-slate-100">
          Update Security Password
        </h2>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <Input
            label="Current Password"
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />

          <Input
            label="New Password"
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <Input
            label="Confirm New Password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button
            type="submit"
            variant="outline"
            size="md"
            loading={changingPassword}
            icon={Lock}
          >
            Update Password
          </Button>
        </form>
      </div>

      {/* Add Address Modal */}
      <Modal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        title="Add New Service Address"
        size="md"
      >
        <form onSubmit={handleSaveAddress} className="space-y-4">
          {/* Live GPS detector bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-fixteal-600 animate-pulse" />
                Live GPS Location
              </p>
              <p className="text-[11px] text-slate-500">
                {addressForm.latitude
                  ? `Lat: ${Number(addressForm.latitude).toFixed(4)}, Lng: ${Number(addressForm.longitude).toFixed(4)}`
                  : 'Detect current location to autofill your address'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={detectingLocation}
              className="px-3 py-1.5 bg-fixteal-600 hover:bg-fixteal-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {detectingLocation ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  <span>Locating...</span>
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Use Live Location</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Address Label
              </label>
              <select
                value={addressForm.label}
                onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                className="w-full text-xs font-semibold py-2 px-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-fixteal-500"
              >
                <option value="Home">Home</option>
                <option value="Office">Office / Shop</option>
                <option value="Parents">Parents' Home</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(addressForm.is_default)}
                  onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked ? 1 : 0 })}
                  className="rounded text-fixteal-600 focus:ring-fixteal-500"
                />
                <span>Set as Default</span>
              </label>
            </div>
          </div>

          <Input
            label="Street Address Line 1"
            required
            placeholder="Flat 402, Block B, Green Valley Apartments"
            value={addressForm.address_line1}
            onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
          />

          <Input
            label="Address Line 2 (Optional)"
            placeholder="Near Metro Station Pillar 128"
            value={addressForm.address_line2}
            onChange={(e) => setAddressForm({ ...addressForm, address_line2: e.target.value })}
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="City"
              required
              value={addressForm.city}
              onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                State <span className="text-rose-500">*</span>
              </label>
              <select
                value={addressForm.state}
                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                className="w-full text-xs font-semibold py-2 px-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-fixteal-500 h-[38px]"
                required
              >
                {statesList.length > 0 ? (
                  statesList.map((st) => {
                    const val = typeof st === 'object' && st !== null ? st.name || st.code : String(st);
                    const label = typeof st === 'object' && st !== null ? st.name || st.code : String(st);
                    return (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    );
                  })
                ) : (
                  <>
                    <option value="Delhi">Delhi</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                  </>
                )}
              </select>
            </div>

            <Input
              label="Pincode"
              required
              value={addressForm.pincode}
              onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowAddressModal(false)}
              disabled={savingAddress}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={savingAddress}
            >
              Save Address
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Address Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingAddressId)}
        onClose={() => setDeletingAddressId(null)}
        onConfirm={handleDeleteAddress}
        title="Remove Saved Address?"
        message="Are you sure you want to delete this address from your profile?"
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
}
