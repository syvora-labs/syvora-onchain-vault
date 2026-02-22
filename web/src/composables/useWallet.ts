import { ref, shallowRef, computed } from "vue";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { REQUIRED_CHAIN_ID } from "../contracts/addresses";

const address = ref<string | null>(null);
const signer = shallowRef<JsonRpcSigner | null>(null);
const provider = shallowRef<BrowserProvider | null>(null);
const chainId = ref<number | null>(null);

if (window.ethereum) {
    window.ethereum.on("accountsChanged", (...args: unknown[]) => {
        const list = args[0] as string[];
        if (list.length === 0) {
            address.value = null;
            signer.value = null;
            provider.value = null;
        } else {
            address.value = list[0] ?? null;
        }
    });

    window.ethereum.on("chainChanged", () => window.location.reload());
}

export function useWallet() {
    const isConnected = computed(() => address.value !== null);

    const isWrongNetwork = computed(() => chainId.value !== null && chainId.value !== REQUIRED_CHAIN_ID);

    async function connect(): Promise<void> {
        if (!window.ethereum) {
            throw new Error("MetaMask is not installed. Please add it to your browser.");
        }

        const _provider = new BrowserProvider(window.ethereum);

        const accounts = (await _provider.send("eth_requestAccounts", [])) as string[];

        const network = await _provider.getNetwork();
        chainId.value = Number(network.chainId);

        if (chainId.value !== REQUIRED_CHAIN_ID) {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: `0x${REQUIRED_CHAIN_ID.toString(16)}` }],
            });
            return;
        }

        const _signer = await _provider.getSigner();

        provider.value = _provider;
        signer.value = _signer;
        address.value = accounts[0] ?? null;
    }

    function disconnect(): void {
        address.value = null;
        signer.value = null;
        provider.value = null;
        chainId.value = null;
    }

    return {
        address,
        signer,
        provider,
        chainId,
        isConnected,
        isWrongNetwork,
        connect,
        disconnect,
    };
}
