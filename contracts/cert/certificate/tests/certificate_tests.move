// Replace 0xYourAddr with your deployed package address
module 0xYourAddr::certificate {
    use std::vector;
    use std::signer;
    use std::option::{Self, Option};
    use std::string;
    use sui::object::{UID};
    use sui::transfer;
    use sui::tx_context::{TxContext};

    // Optional dependencies (implement these modules separately)
    // - org_registry::is_registered(addr): bool
    // - cer_token::has_active_license(addr): bool
    use 0xYourAddr::org_registry;
    use 0xYourAddr::cer_token;

    /// Config resource for admin root
    resource struct Config has key {
        admin: address
    }

    /// Certificate resource stored on-chain (soulbound NFT metadata)
    /// Note: We intentionally do NOT provide transfer entry-functions.
    resource struct Certificate has key {
        id: UID,
        cert_id: u64,                 // internal sequential id (optional)
        owner: address,               // recipient wallet at time of mint
        issuer: address,              // org address that issued
        issuer_org_name: vector<u8>,  // utf8 bytes (optional)
        metadata_cid: vector<u8>,     // IPFS CID bytes
        issuer_signature: vector<u8>, // signature by issuer (off-chain)
        root_signature: Option<vector<u8>>, // optional signature by Admin Root (Bộ)
        revoked: bool,
        issued_at: u64,               // unix timestamp (seconds) (optional)
        claimed: bool                 // whether student has claimed on-chain
    }

    /// Event-like object to track ID increment (simple counter pattern)
    resource struct Counter has key {
        current: u64
    }

    /// Initialize module: deployer becomes admin
    public entry fun init_module(admin: &signer, ctx: &mut TxContext) {
        let admin_addr = signer::address_of(admin);
        assert!(!exists<Config>(admin_addr), 0);
        move_to(admin, Config { admin: admin_addr });
        // create counter under admin to issue cert_id
        let c = Counter { current: 0 };
        move_to(admin, c);
    }

    /// Admin assert helper
    fun assert_is_admin(s: &signer) {
        let addr = signer::address_of(s);
        let cfg_ref = borrow_global<Config>(addr);
        assert!(cfg_ref.admin == addr, 1);
    }

    /// Internal: increase and return next cert id (stored under admin)
    fun next_cert_id(admin_addr: address): u64 acquires Counter {
        let c = borrow_global_mut<Counter>(admin_addr);
        let out = c.current;
        c.current = out + 1;
        out
    }

    ///////////////////////////////////////////////////////////////////////////
    // MINT certificate
    //
    // Two minting patterns supported:
    // 1) `mint_and_send` — create Certificate object and move_to recipient (student).
    //    After minting student can call `claim_certificate()` to set claimed=true.
    //
    // 2) `mint_to_addr` — admin can mint to any address (for testing or other flows).
    //
    // Access control:
    // - We expect mint called by Org Admin (issuer) OR Admin Root for final minting.
    // - We check org_registry::is_registered(issuer) to ensure issuer is authorized.
    // - Optionally check cer_token::has_active_license(issuer) if you require Org holds CER token.
    ///////////////////////////////////////////////////////////////////////////

    public entry fun mint_and_send(
        issuer_signer: &signer,
        recipient: address,
        issuer_org_name: vector<u8>,
        metadata_cid: vector<u8>,
        issuer_signature: vector<u8>,
        created_at: u64,
        ctx: &mut TxContext
    ) {
        let issuer_addr = signer::address_of(issuer_signer);

        // require issuer is registered in registry
        assert!(org_registry::is_registered(issuer_addr), 100);

        // (optional) require issuer has active CER token/license
        // If you implement cer_token::has_active_license(addr) -> bool, uncomment:
        // assert!(cer_token::has_active_license(issuer_addr), 101);

        // cert_id generation: use admin address from Config. We'll read admin from issuer's address space:
        // For simplicity, we assume the Config and Counter are owned by admin signer (deploy address).
        // In practice you may store a global config address constant.
        // Here we look up Config under issuer_addr? If not present, use admin under deployer.
        // For simplicity in this example assume admin holds Config and Counter and issuer_signer
        // can access next_cert_id by calling with admin address. In production, better pass admin address or make Counter global.
        //
        // We'll implement a simpler approach: compute cert_id from created_at + random-ish (NOT ideal)
        let cert_id: u64 = next_cert_id(signer::address_of(issuer_signer));

        let uid = UID::new(ctx);
        let cert = Certificate {
            id: uid,
            cert_id,
            owner: recipient,
            issuer: issuer_addr,
            issuer_org_name,
            metadata_cid,
            issuer_signature,
            root_signature: Option::none<vector<u8>>(),
            revoked: false,
            issued_at: created_at,
            claimed: false
        };

        // Move certificate into recipient's object ownership (so it's visible in their wallet)
        move_to(&recipient, cert);
    }

    /// Mint and directly set root_signature (callable by Admin Root) — used when Bộ ký luôn và system auto-send NFT
    public entry fun mint_and_send_with_root(
        admin: &signer,
        issuer_addr: address,
        recipient: address,
        issuer_org_name: vector<u8>,
        metadata_cid: vector<u8>,
        issuer_signature: vector<u8>,
        root_signature: vector<u8>,
        created_at: u64,
        ctx: &mut TxContext
    ) {
        assert_is_admin(admin);

        // verify issuer is registered
        assert!(org_registry::is_registered(issuer_addr), 110);

        let cert_id: u64 = next_cert_id(signer::address_of(admin));
        let uid = UID::new(ctx);
        let cert = Certificate {
            id: uid,
            cert_id,
            owner: recipient,
            issuer: issuer_addr,
            issuer_org_name,
            metadata_cid,
            issuer_signature,
            root_signature: Option::some(root_signature),
            revoked: false,
            issued_at: created_at,
            claimed: false
        };
        move_to(&recipient, cert);
    }

    ///////////////////////////////////////////////////////////////////////////
    // CLAIM certificate (by student)
    // - Student calls claim to mark `claimed = true`. This is an on-chain confirmation step.
    // - This does NOT transfer the object (it is assumed the certificate object already sits in student's object list).
    ///////////////////////////////////////////////////////////////////////////
    public entry fun claim_certificate(student: &signer, cert: &mut Certificate) {
        let student_addr = signer::address_of(student);
        // must be owner (the certificate owner field must match caller)
        assert!(cert.owner == student_addr, 200);
        // can't claim revoked cert
        assert!(!cert.revoked, 201);
        cert.claimed = true;
    }

    ///////////////////////////////////////////////////////////////////////////
    // SIGN BY ROOT (Bộ) - attach root signature to an existing certificate
    // - This function is useful if Org minted a certificate then Bộ signs later.
    ///////////////////////////////////////////////////////////////////////////
    public entry fun sign_by_root(admin: &signer, cert: &mut Certificate, root_signature: vector<u8>) {
        assert_is_admin(admin);
        cert.root_signature = Option::some(root_signature);
    }

    ///////////////////////////////////////////////////////////////////////////
    // REVOKE / RESTORE
    // - Only Admin Root can revoke or restore.
    ///////////////////////////////////////////////////////////////////////////
    public entry fun revoke_certificate(admin: &signer, cert: &mut Certificate) {
        assert_is_admin(admin);
        cert.revoked = true;
    }

    public entry fun restore_certificate(admin: &signer, cert: &mut Certificate) {
        assert_is_admin(admin);
        cert.revoked = false;
    }

    ///////////////////////////////////////////////////////////////////////////
    // VIEW / VERIFY helpers (read-only)
    // - verify_onchain: performs simple on-chain checks: not revoked, owner matches, cid matches.
    // - full cryptographic signature verification should be done off-chain using stored signatures.
    ///////////////////////////////////////////////////////////////////////////
    public fun verify_onchain(cert: &Certificate, expected_owner: address, expected_cid: vector<u8>): bool {
        if (cert.revoked) {
            return false;
        };
        if (cert.owner != expected_owner) {
            return false;
        };
        if (!vector::equal(&cert.metadata_cid, &expected_cid)) {
            return false;
        };
        // root_signature presence is not mandatory; business rule may require it
        true
    }

    /// Return basic certificate info for front-end consumption
    public fun get_certificate_info(cert: &Certificate):
        (u64, address, address, vector<u8>, bool, bool, Option<vector<u8>>) {
        (
            cert.cert_id,
            cert.owner,
            cert.issuer,
            cert.metadata_cid,
            cert.revoked,
            cert.claimed,
            cert.root_signature
        )
    }
}
