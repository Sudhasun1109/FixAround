const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../client/src/pages/customer/Profile.jsx');
let code = fs.readFileSync(targetPath, 'utf8');

// 1. Add Edit2 import
if (!code.includes('Edit2,')) {
  code = code.replace(/Trash2,/, 'Trash2,\n  Edit2,');
}

// 2. Add editingAddressId state and default to Tiruppur, Tamil Nadu
code = code.replace(
  /const \[showAddressModal, setShowAddressModal\] = useState\(false\);[\s\S]*?is_default: 0,[\s\S]*?\}\);/,
  `const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    address_line1: '',
    address_line2: '',
    city: 'Tiruppur',
    state: 'Tamil Nadu',
    pincode: '641601',
    is_default: 0,
  });`
);

// 3. Add handlers
code = code.replace(
  /\/\/ Add address[\s\S]*?const handleSaveAddress = async \(e\) => \{[\s\S]*?fetchAddresses\(\);[\s\S]*?\} catch \(err\) \{[\s\S]*?\} finally \{[\s\S]*?setSavingAddress\(false\);[\s\S]*?\};/,
  `const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      label: 'Home',
      address_line1: '',
      address_line2: '',
      city: 'Tiruppur',
      state: 'Tamil Nadu',
      pincode: '641601',
      is_default: addresses.length === 0 ? 1 : 0,
    });
    setShowAddressModal(true);
  };

  const handleOpenEditAddress = (addr) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      label: addr.label || 'Home',
      address_line1: addr.address_line1 || '',
      address_line2: addr.address_line2 || '',
      city: addr.city || 'Tiruppur',
      state: addr.state || 'Tamil Nadu',
      pincode: addr.pincode || '641601',
      is_default: addr.is_default ? 1 : 0,
    });
    setShowAddressModal(true);
  };

  // Add or Update address
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!addressForm.address_line1 || !addressForm.city || !addressForm.pincode) {
      showToast.error('Please fill in line 1, city, and pincode');
      return;
    }

    try {
      setSavingAddress(true);
      if (editingAddressId) {
        await addressesApi.update(editingAddressId, addressForm);
        showToast.success('Address updated successfully.');
      } else {
        await addressesApi.create(addressForm);
        showToast.success('Address added to your profile.');
      }
      setShowAddressModal(false);
      setEditingAddressId(null);
      setAddressForm({
        label: 'Home',
        address_line1: '',
        address_line2: '',
        city: 'Tiruppur',
        state: 'Tamil Nadu',
        pincode: '641601',
        is_default: 0,
      });
      fetchAddresses();
    } catch (err) {
      showToast.error(err.message || (editingAddressId ? 'Failed to update address' : 'Failed to add address'));
    } finally {
      setSavingAddress(false);
    }
  };`
);

// 4. Update Add Address button onClick
code = code.replace(/onClick=\{\(\) => setShowAddressModal\(true\)\}/g, 'onClick={handleOpenAddAddress}');

// 5. Add Edit button to address card
code = code.replace(
  /<div className="pt-2 border-t border-slate-200\/60 flex items-center justify-between text-xs">[\s\S]*?<button[\s\S]*?onClick=\{\(\) => setDeletingAddressId\(addr\.id\)\}[\s\S]*?<\/div>/,
  `<div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
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
                      onClick={() => handleOpenEditAddress(addr)}
                      className="text-slate-600 hover:text-fixteal-600 font-semibold flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeletingAddressId(addr.id)}
                    className="text-rose-600 hover:text-rose-700 p-1 ml-auto"
                    title="Remove address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>`
);

// 6. Modal Title and Button text
code = code.replace(/title="Add New Service Address"/g, 'title={editingAddressId ? "Edit Service Address" : "Add New Service Address"}');
code = code.replace(/>Save Address</g, '>{editingAddressId ? "Update Address" : "Save Address"}<');

fs.writeFileSync(targetPath, code, 'utf8');
console.log('Profile.jsx updated successfully');
