module org::org_registry {
    use std::string;
    use std::option;
    use sui::object;
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;

    /// Struct đại diện một tổ chức đã được duyệt
    public struct Organization has key, store {
        id: object::UID,
        org_id: u64,
        name: string::String,
        wallet: address,
        website: option::Option<string::String>,
        approved: bool,
    }

    /// Lưu danh sách tất cả các tổ chức được cấp quyền
    public struct OrgRegistry has key, store {
        id: object::UID,
        admin_root: address,
        next_org_id: u64,
        orgs: vector<Organization>,
    }

    /// Sự kiện khi tổ chức được thêm mới
    public struct OrgAddedEvent has copy, drop {
        org_id: u64,
        name: string::String,
        wallet: address,
    }

    /// Sự kiện khi tổ chức bị thu hồi quyền
    public struct OrgRevokedEvent has copy, drop {
        org_id: u64,
        wallet: address,
    }

    /// Khởi tạo registry, chỉ chạy khi deploy
    public fun init(ctx: &mut TxContext) {
        let admin_root: address = @0x86d988e6f68f1ae095f19569194bcfd7c5f54a5125c26bffead54e20f7451042;

        let registry = OrgRegistry {
            id: object::new(ctx),
            admin_root,
            next_org_id: 1,
            orgs: vector::empty<Organization>(),
        };

        transfer::share_object(registry);
    }

    /// Cho phép admin root thêm tổ chức mới
    public entry fun add_org(
        registry: &mut OrgRegistry,
        name: string::String,
        wallet: address,
        website: option::Option<string::String>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == registry.admin_root, 1);

        let org = Organization {
            id: object::new(ctx),
            org_id: registry.next_org_id,
            name,
            wallet,
            website,
            approved: true,
        };

        vector::push_back(&mut registry.orgs, org);
        event::emit(OrgAddedEvent {
            org_id: registry.next_org_id,
            name: org.name,
            wallet: org.wallet,
        });

        registry.next_org_id = registry.next_org_id + 1;
    }

    /// Admin Root có thể thu hồi quyền tổ chức
    public entry fun revoke_org(
        registry: &mut OrgRegistry,
        org_id: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == registry.admin_root, 1);

        let len = vector::length(&registry.orgs);
        let mut i = 0;
        while (i < len) {
            let org_ref = &mut vector::borrow_mut(&mut registry.orgs, i);
            if (org_ref.org_id == org_id && org_ref.approved) {
                org_ref.approved = false;
                event::emit(OrgRevokedEvent {
                    org_id,
                    wallet: org_ref.wallet,
                });
                break;
            };
            i = i + 1;
        };
    }

    /// Xem thông tin một tổ chức theo ID
    public fun get_org_by_id(registry: &OrgRegistry, org_id: u64): option::Option<&Organization> {
        let len = vector::length(&registry.orgs);
        let mut i = 0;
        while (i < len) {
            let org_ref = &vector::borrow(&registry.orgs, i);
            if (org_ref.org_id == org_id) {
                return option::some(org_ref);
            };
            i = i + 1;
        };
        option::none<&Organization>()
    }

    /// Kiểm tra tổ chức có được duyệt không (dành cho module khác gọi)
    public fun is_org_approved(registry: &OrgRegistry, wallet: address): bool {
        let len = vector::length(&registry.orgs);
        let mut i = 0;
        while (i < len) {
            let org_ref = &vector::borrow(&registry.orgs, i);
            if (org_ref.wallet == wallet && org_ref.approved) {
                return true;
            };
            i = i + 1;
        };
        false
    }
}
