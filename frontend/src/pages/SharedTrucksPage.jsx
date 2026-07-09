import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listSharedGroups,
  joinSharedGroup,
  leaveSharedGroup,
  getGroupCapacity,
  getGroupCostSplit,
} from '../api/sharedMatching.api';
import { Card, Button, Input, Select, Option, Loader, Alert } from '../components/ui';
import { ROUTES } from '../constants/routes';
import { useNavigate } from 'react-router-dom';

// Helper to format numbers nicely
const fmt = (n) => (n != null ? Number(n).toLocaleString() : '-');

const SharedTrucksPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filters, setFilters] = useState({ status: '', date: '', pickup: '', destination: '' });

  const queryKey = ['sharedGroups', page, limit, filters];

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery(
    queryKey,
    () =>
      listSharedGroups({
        page,
        limit,
        status: filters.status || undefined,
        date: filters.date || undefined,
        pickup: filters.pickup || undefined,
        destination: filters.destination || undefined,
      }),
    {
      keepPreviousData: true,
      staleTime: 5_000,
      refetchInterval: 10_000, // live capacity updates every 10s
    },
  );

  const joinMutation = useMutation(({ groupId, bookingId }) => joinSharedGroup(groupId, bookingId), {
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const leaveMutation = useMutation(({ groupId, bookingId }) => leaveSharedGroup(groupId, bookingId), {
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1); // reset page on filter change
  };

  const handleJoin = async (groupId) => {
    // Assume the current farmer's bookingId is passed via query param or context – for demo we ask user.
    const bookingId = prompt('Enter your booking ID to join this shared truck:');
    if (bookingId) {
      await joinMutation.mutateAsync({ groupId, bookingId });
    }
  };

  const handleLeave = async (groupId) => {
    const bookingId = prompt('Enter your booking ID to leave this shared truck:');
    if (bookingId) {
      await leaveMutation.mutateAsync({ groupId, bookingId });
    }
  };

  if (isLoading) return <Loader />;
  if (isError) return <Alert severity="error">{error?.message || 'Failed to load shared trucks'}</Alert>;

  const { groups = [], pagination = {} } = data || {};

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Shared Trucks</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Select name="status" value={filters.status} onChange={handleFilterChange} placeholder="All statuses">
          <Option value="">All statuses</Option>
          <Option value="open">Open</Option>
          <Option value="full">Full</Option>
          <Option value="cancelled">Cancelled</Option>
        </Select>
        <Input type="date" name="date" value={filters.date} onChange={handleFilterChange} placeholder="Date" />
        <Input name="pickup" value={filters.pickup} onChange={handleFilterChange} placeholder="Pickup location" />
        <Input name="destination" value={filters.destination} onChange={handleFilterChange} placeholder="Destination" />
      </div>

      {/* List of shared groups as cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.id} className="shadow-lg backdrop-blur-sm bg-white/70 p-4">
            <div className="flex flex-col h-full">
              <h2 className="font-medium text-xl mb-2">
                {group.start_location} → {group.end_location}
              </h2>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Scheduled:</strong> {new Date(group.scheduled_date).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Remaining Capacity:</strong> {fmt(group.remaining_capacity_kg)} kg
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Farmers Joined:</strong> {group.member_count}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Total Cost:</strong> ₹ {fmt(group.total_cost)}
              </p>

              {/* Action Buttons */}
              <div className="mt-auto flex gap-2 pt-4">
                <Button
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={joinMutation.isLoading}
                  onClick={() => handleJoin(group.id)}
                >
                  Join Shared Truck
                </Button>
                <Button
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                  disabled={leaveMutation.isLoading}
                  onClick={() => handleLeave(group.id)}
                >
                  Leave Shared Truck
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center items-center mt-6 space-x-4">
        <Button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
        >
          Previous
        </Button>
        <span>
          Page {page} of {pagination.totalPages || 1}
        </span>
        <Button
          disabled={page >= (pagination.totalPages || 1)}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>

      {/* Loading overlay when refetching in background */}
      {isFetching && <Loader className="absolute inset-0 opacity-50" />}
    </div>
  );
};

export default SharedTrucksPage;
