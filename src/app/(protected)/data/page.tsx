"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { labelSetups } from "@/db/schema";
import { eq } from "drizzle-orm";

interface LabelSetup {
  id: string;
  userId: string;
  labelLengthMm: string;
  labelHeightMm: string;
  labelThicknessMm: string;
  labelColourBackground: string;
  textColour: string;
  labelQuantity: number;
  style: string;
  noOfHoles: number;
  holeSizeMm: string;
  holeDistanceMm: string;
  lines: Array<{
    text: string;
    textSizeMm: number;
    spacingTopMm: string | number;
    spacingLeftMm: string | number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function DataPage() {
  const [setups, setSetups] = useState<LabelSetup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/label-setups");
        if (response.ok) {
          const data = await response.json();
          setSetups(data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this setup?")) {
      try {
        const response = await fetch(`/api/label-setups/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          // Refresh the data
          setSetups(setups.filter(setup => setup.id !== id));
        }
      } catch (error) {
        console.error("Error deleting setup:", error);
      }
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Label Setups</h1>
          <div className="space-x-4">
            <Link
              href="/data/new"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              + New
            </Link>
            <a
              href="/api/export"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Export Excel
            </a>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : setups.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No label setups found</p>
            <Link
              href="/data/new"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Create your first setup
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Style
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Label Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {setups.map((setup) => (
                  <tr key={setup.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {setup.style || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {setup.labelLengthMm} × {setup.labelHeightMm} mm
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {setup.labelQuantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(setup.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <span
                        className="text-gray-400 mr-4 cursor-not-allowed"
                        title="Edit functionality coming soon"
                      >
                        Edit
                      </span>
                      <button
                        onClick={() => handleDelete(setup.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}