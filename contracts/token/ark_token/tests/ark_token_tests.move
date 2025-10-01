module ark_token_tests::ark {

    use sui::coin::{Self, TreasuryCap};
    use sui::tx_context::TxContext;
    use sui::transfer;

    /// Định nghĩa type cho token ARK
    public struct ARK has drop {}

    /// Hàm khởi tạo khi publish
    fun init(witness: ARK, ctx: &mut TxContext) {
        let (treasury, metadata) = coin::create_currency(
            witness,
            6,                // decimals
            b"ARK Testnet",       // name
            b"ARK",              // symbol
            b"",              // description
            option::none(),   // icon
            ctx,
        );
        transfer::public_freeze_object(metadata);
        transfer::public_transfer(treasury, ctx.sender());
    }

    /// Mint thêm token
    public fun mint(
        treasury_cap: &mut TreasuryCap<ARK>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext,
    ) {
        let coin = coin::mint(treasury_cap, amount, ctx);
        transfer::public_transfer(coin, recipient)
    }

}
