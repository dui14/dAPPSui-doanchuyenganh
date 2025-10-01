module liquidity_tests::liq {
    use sui::tx_context::TxContext;
    use sui::object;
    use sui::transfer;
    use sui::coin::{Self, Coin, value, destroy_zero};
    use sui::balance;
    use sui::clock::{Self, Clock};

    /// Định nghĩa Pool object
    struct Pool has key {
        id: object::UID,
        total_sui: u64,
        total_usdc: u64,
    }

    /// Thông tin user
    struct UserInfo has key, store {
        id: object::UID,
        deposited_sui: u64,
        deposited_usdc: u64,
        last_deposit_time: u64,
    }

    /// Khởi tạo pool
    public entry fun init_pool(ctx: &mut TxContext) {
        let pool = Pool {
            id: object::new(ctx),
            total_sui: 0,
            total_usdc: 0,
        };
        transfer::transfer(pool, ctx.sender());
    }

    /// Khởi tạo user info
    public entry fun init_user(ctx: &mut TxContext) {
        let user = UserInfo {
            id: object::new(ctx),
            deposited_sui: 0,
            deposited_usdc: 0,
        };
        transfer::transfer(user, ctx.sender());
    }

    /// Add 1 SUI + 1 USDC (không giới hạn thời gian)
    public entry fun add_liquidity(
        pool: &mut Pool,
        user: &mut UserInfo,
        sui_coin: Coin<0x2::sui::SUI>,
        usdc_coin: Coin<0xea10912247c015ead590e481ae8545ff1518492dee41d6d03abdad828c1d2bde::usdc::USDC>,
        _ctx: &mut TxContext
    ) {
        let sui_amount = value(&sui_coin);
        let usdc_amount = value(&usdc_coin);

        if (sui_amount != 1 || usdc_amount != 1) {
            abort 1;
        };

        // cập nhật user info
        user.deposited_sui = user.deposited_sui + 1;
        user.deposited_usdc = user.deposited_usdc + 1;

        // cập nhật pool
        pool.total_sui = pool.total_sui + 1;
        pool.total_usdc = pool.total_usdc + 1;

        // coin bị đốt (ở testnet có thể giữ lại, ở đây destroy cho gọn)
        destroy_zero(sui_coin);
        destroy_zero(usdc_coin);
    }

    /// Rút toàn bộ phần user đã add (ngay lập tức)
    public entry fun withdraw(
        pool: &mut Pool,
        user: &mut UserInfo,
        ctx: &mut TxContext
    ) {
        let sui_back = user.deposited_sui;
        let usdc_back = user.deposited_usdc;

        if (sui_back == 0 || usdc_back == 0) {
            abort 2; // không có gì để rút
        };

        // reset user
        user.deposited_sui = 0;
        user.deposited_usdc = 0;

        // giảm pool
        pool.total_sui = pool.total_sui - sui_back;
        pool.total_usdc = pool.total_usdc - usdc_back;

        // ⚠️ chỉ để test: mint lại coin giả để trả cho user
        let sui_coin = coin::mint_for_testing::<0x2::sui::SUI>(sui_back, ctx);
        let usdc_coin = coin::mint_for_testing::<0xea10912247c015ead590e481ae8545ff1518492dee41d6d03abdad828c1d2bde::USDC>(usdc_back, ctx);

        transfer::transfer(sui_coin, ctx.sender());
        transfer::transfer(usdc_coin, ctx.sender());
    }
}
