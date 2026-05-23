import React, { useState } from 'react';
import { MemberDetails } from '@/types/member';
import { Button } from '@/components/ui/Button';
import { FORM_FIELDS, getInitialFormState, formatFullName, formatDisplayValue } from '@/utils/tabUtils';
import { memberApi } from '@/api/memberApi';

interface PrincipalTabProps {
  member: MemberDetails;
  onUpdate: () => void;
}

export const PrincipalTab: React.FC<PrincipalTabProps> = ({ member, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(getInitialFormState.principal(member));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'nationalID', 'phoneNumber', 'dateOfBirth', 'groupName'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const principalId = member.principal.id;
      if (!principalId) {
        setError("Member ID is missing — cannot save.");
        return;
      }
      await memberApi.updatePrincipal(principalId, { ...member.principal, ...formData }, member);
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update principal information');
      console.error('Failed to update principal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(getInitialFormState.principal(member));
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Principal Details</h2>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>Edit</Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(FORM_FIELDS.principal).map(([key, field]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={formData[key as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={formData[key as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center"
            >
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              Save Changes
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <p className="mt-1 text-gray-900">{formatDisplayValue(member.principal?.firstName)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <p className="mt-1 text-gray-900">{formatDisplayValue(member.principal?.lastName)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">National ID</label>
              <p className="mt-1 text-gray-900">{formatDisplayValue(member.principal?.nationalID)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <p className="mt-1 text-gray-900">{formatDisplayValue(member.principal?.phoneNumber)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
              <p className="mt-1 text-gray-900">{formatDisplayValue(member.principal?.dateOfBirth)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Group Name</label>
              <p className="mt-1 text-gray-900">{formatDisplayValue(member.principal?.groupName)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
