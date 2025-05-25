'use client';

import { useEffect, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { readContract } from 'viem/actions';
import { toast } from 'sonner';

const contractAddress = '0x0E3C22980f73c1EC61Af4345512D2807C1A3feea';

const abi = [
  {
    inputs: [{ internalType: 'enum eSaints.Rarity', name: '', type: 'uint8' }],
    name: 'rarities',
    outputs: [
      { internalType: 'uint256', name: 'maxSupply', type: 'uint256' },
      { internalType: 'uint256', name: 'minted', type: 'uint256' },
      { internalType: 'uint256', name: 'price', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
];

const rarityLabels = ['Common', 'Rare', 'Legendary', 'Epic', 'Mythic'];

export default function AdminPage() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [isOwner, setIsOwner] = useState(false);
  const [data, setData] = useState<
    { rarity: string; max: number; minted: number }[]
  >([]);

  useEffect(() => {
    const fetchOwner = async () => {
      if (!address || !publicClient) return;

      try {
        const owner = await readContract(publicClient, {
          address: contractAddress,
          abi,
          functionName: 'owner',
        });

        if (owner.toLowerCase() === address.toLowerCase()) {
          setIsOwner(true);
        } else {
          toast.error('Access denied: not contract owner.');
        }
      } catch (e) {
        toast.error('Failed to check owner.');
      }
    };

    fetchOwner();
  }, [address, publicClient]);

  useEffect(() => {
    const fetchMintData = async () => {
      if (!publicClient || !isOwner) return;

      const promises = rarityLabels.map(async (_label, index) => {
        const [maxSupply, minted] = await readContract(publicClient, {
          address: contractAddress,
          abi,
          functionName: 'rarities',
          args: [index],
        });

        return {
          rarity: rarityLabels[index],
          max: Number(maxSupply),
          minted: Number(minted),
        };
      });

      const results = await Promise.all(promises);
      setData(results);
    };

    fetchMintData();
  }, [isOwner, publicClient]);

  if (!isOwner) {
    return (
      <main className="min-h-screen bg-black text-white p-6">
        <h1 className="text-xl">Checking admin access...</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">eSaints Mint Overview</h1>
      <table className="w-full border border-white text-sm text-left">
        <thead>
          <tr className="bg-gray-800">
            <th className="p-2 border">Rarity</th>
            <th className="p-2 border">Max Supply</th>
            <th className="p-2 border">Minted</th>
            <th className="p-2 border">Remaining</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-t border-white">
              <td className="p-2 border">{row.rarity}</td>
              <td className="p-2 border">{row.max}</td>
              <td className="p-2 border">{row.minted}</td>
              <td className="p-2 border">{row.max - row.minted}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

