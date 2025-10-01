module ark_token::ark {
    use sui::coin::{Self, TreasuryCap};
    use sui::tx_context::TxContext;
    use sui::transfer;
    use sui::url;
    use sui::object;
    use std::option;

    /// Định nghĩa type cho token ARK
    public struct ARK has drop {}

    public struct MintCap has key, store {
        id: object::UID,
        owner: address,
    }

    /// Hàm khởi tạo khi publish
    fun init(witness: ARK, ctx: &mut TxContext) {
        let owner: address = @0x86d988e6f68f1ae095f19569194bcfd7c5f54a5125c26bffead54e20f7451042;
        let (mut treasury, metadata) = coin::create_currency(
            witness,
            6,                // decimals
            b"ARK Testnet",       // name
            b"ARK",              // symbol
            b"",              // description
            option::some(url::new_unsafe_from_bytes(b"https://ipfs.io/ipfs/bafkreieqo3m5dyvaaam6h2sf47wkcebzlb6qtvnfrsu4quziavjfdxvo6m")),   // icon
            ctx,
        );
        let supply = coin::mint(&mut treasury, 1_000_000_000, ctx);
        let cap = MintCap { id: object::new(ctx), owner };

        transfer::public_transfer(supply, owner);
        transfer::public_transfer(treasury, owner);
        transfer::public_transfer(cap, owner);
        transfer::public_freeze_object(metadata);
    }

    public fun mint_more(
        treasury_cap: &mut TreasuryCap<ARK>,
        cap: &MintCap,
        amount: u64,
        ctx: &mut TxContext
    ) {
        // Chỉ cho phép owner thực hiện
        assert!(tx_context::sender(ctx) == cap.owner, 1);

        let new_coins = coin::mint(treasury_cap, amount, ctx);
        transfer::public_transfer(new_coins, cap.owner);
    }

}