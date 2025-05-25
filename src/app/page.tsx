'use client';

import { useEffect, useState } from 'react';
import {
  useAccount,
  useWriteContract,
  usePublicClient,
} from 'wagmi';
import { readContract } from 'viem/actions';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { toast } from 'sonner';

const contractAddress = '0x0E3C22980f73c1EC61Af4345512D2807C1A3feea';
const abi = [
  {
    inputs: [
      { internalType: 'enum eSaints.Rarity', name: 'rarity', type: 'uint8' },
      { internalType: 'string', name: 'tokenURI', type: 'string' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
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

const nftData = [
  { uri: 'bafkreigsmoofeo2z2t3zfubvkguwxcaaxpnrlethp462vjqpiw6oyhqlxu' },
  { uri: 'bafkreidvzmttrolornde7nmdtbweuynuasgt3f4vdnsjx6dqz2bfhexxye' },
  { uri: 'bafkreiducvmwyvtl75tjncfpi5zux23awhruon3wyplh7ymfgrgkptv564' },
  { uri: 'bafkreigoy5g3t2abfjwwh5sxpnuscnblnejmlrsg344gv5dgicvto7xhkm' },
  { uri: 'bafkreiar2owyv5uxgmh3vlumxdt6vd32ffj34elgbyt5efefylewxqlc74' },
  { uri: 'bafkreicheuxs24nywprfgivubaisudtg7raljertxfuiotpaonlf2dh4v4' },
  { uri: 'bafkreiavgcx3f7bs6i7e7wlkgocl5rokjh7iotltbcmdefw4xwytuz3xte' },
  { uri: 'bafkreifvcenwjr2sj2xsbaqhw25jyt3sg7zspi2sc7y7n642tq2gphk5da' },
  { uri: 'bafkreibfhg4acfwxxje67w7zcfnv4o54qzzsbx27xbu5k4kac22vfrbguq' },
  { uri: 'bafkreifl73fzsczlrwznqgfp6idwfbp5qc4zv4biubzgjthwfcpi2vo3ae' },
];

const gatewayUrl = (uri: string) =>
  uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');

export default function MintPage() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [isOwner, setIsOwner] = useState(false);
  const { writeContract, isPending } = useWriteContract();
  const [nfts, setNfts] = useState<any[]>([]);

  useEffect(() => {
    const checkOwner = async () => {
      if (!address || !publicClient) return;

      const ownerAddress = await readContract(publicClient, {
        address: contractAddress,
        abi,
        functionName: 'owner',
      });

      if (address.toLowerCase() === ownerAddress.toLowerCase()) {
        setIsOwner(true);
      }
    };

    checkOwner();
  }, [address, publicClient]);

  useEffect(() => {
    const loadNFTs = async () => {
      const rarityMap: any = {
        Common: { index: 0, price: 2, color: 'bg-gray-400 text-black' },
        Rare: { index: 1, price: 8, color: 'bg-blue-400 text-white' },
        Legendary: { index: 2, price: 12, color: 'bg-purple-500 text-white' },
        Epic: { index: 3, price: 50, color: 'bg-amber-500 text-black' },
        Mythic: { index: 4, price: 25, color: 'bg-yellow-400 text-black' },
      };

      const enriched = await Promise.all(
        nftData.map(async (nft) => {
          const res = await fetch(gatewayUrl(`ipfs://${nft.uri}`));
          const meta = await res.json();

          const rarityAttr = meta.attributes.find(
            (a: any) => a.trait_type.toLowerCase() === 'rarity'
          );
          const rarityName = rarityAttr?.value || 'Common';
          const rarityIndex = rarityMap[rarityName]?.index ?? 0;

          const supplyData: any = await readContract(publicClient, {
            address: contractAddress,
            abi,
            functionName: 'rarities',
            args: [rarityIndex],
          });

          const maxSupply = Number(supplyData[0]);
          const minted = Number(supplyData[1]);

          return {
            ...nft,
            ...meta,
            rarityName,
            rarity: rarityIndex,
            price: rarityMap[rarityName]?.price ?? 2,
            rarityColor: rarityMap[rarityName]?.color ?? 'bg-gray-400 text-black',
            minted,
            maxSupply,
          };
        })
      );

      setNfts(enriched);
    };

    loadNFTs();
  }, [publicClient]);

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">eSaints: Dawn Series</h1>
        <ConnectButton />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {nfts.map((nft, i) => (
          <div key={i} className="bg-gray-800 rounded-xl p-4">
            <img
              src={gatewayUrl(nft.image)}
              alt={nft.name}
              className="rounded-xl w-full mb-4"
            />
            <h2 className="text-xl font-semibold flex items-center gap-2">
              {nft.name}
              <span
                className={`text-xs font-bold px-2 py-1 rounded-full ${nft.rarityColor}`}
              >
                {nft.rarityName}
              </span>
            </h2>
            <p className="mb-2 whitespace-pre-line">{nft.description}</p>
            {nft.attributes?.map((attr: any, j: number) => (
              <p key={j} className="text-sm">
                <strong>{attr.trait_type.toLowerCase()}:</strong> {attr.value}
              </p>
            ))}
            <p className="text-sm italic">Minted: {nft.minted} / {nft.maxSupply}</p>
            <p className="mt-2">
              Price: {isOwner ? 'Free' : `${nft.price} MATIC`} ({nft.rarityName})
            </p>
            <button
              onClick={() => {
                if (!address) {
                  toast.error('Please connect your wallet first.');
                  return;
                }

                writeContract({
                  address: contractAddress,
                  abi,
                  functionName: 'mint',
                  args: [nft.rarity, `ipfs://${nft.uri}`],
                  value: isOwner ? BigInt(0) : BigInt(nft.price * 1e18),
                });

                toast('Minting started...');
              }}
              disabled={isPending || nft.minted >= nft.maxSupply}
              className="bg-indigo-600 hover:bg-indigo-700 rounded px-4 py-2 font-semibold mt-4 disabled:opacity-50"
            >
              {nft.minted >= nft.maxSupply
                ? 'Sold Out'
                : isPending
                ? 'Minting...'
                : 'Mint'}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}

