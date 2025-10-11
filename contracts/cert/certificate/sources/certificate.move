module certificate::certificate {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    use std::vector;
    use sui::event;
    use cer_token::cer::{Self, CER};
    use sui::coin::{Self, Coin};

    // Errors
    const E_NOT_AUTHORIZED: u64 = 0;
    const E_INVALID_STATE: u64 = 1;

    // Certificate Status
    const PENDING_FACULTY: u8 = 0;
    const PENDING_UNIVERSITY: u8 = 1;
    const PENDING_MINISTRY: u8 = 2;
    const APPROVED: u8 = 3;
    const REJECTED: u8 = 4;

    // Capability để quản lý quyền
    struct AdminCap has key { id: UID }
    struct FacultyCap has key { id: UID, faculty_id: ID }
    struct UniversityCap has key { id: UID }
    struct MinistryCap has key { id: UID }

    // Cấu trúc chứng chỉ
    struct Certificate has key {
        id: UID,
        student_address: address,
        ipfs_hashes: vector<String>,
        status: u8,
        faculty_id: ID,
        signature: vector<u8>
    }

    // Events
    struct CertificateRequested has copy, drop {
        certificate_id: ID,
        student: address
    }

    struct CertificateApproved has copy, drop {
        certificate_id: ID,
        approver: address
    }

    // === Admin Functions ===
    
    fun init(ctx: &mut TxContext) {
        transfer::transfer(AdminCap {
            id: object::new(ctx)
        }, tx_context::sender(ctx));
    }

    public fun create_faculty_cap(
        _: &AdminCap,
        faculty_id: ID,
        faculty_address: address,
        ctx: &mut TxContext
    ) {
        transfer::transfer(
            FacultyCap { 
                id: object::new(ctx),
                faculty_id
            },
            faculty_address
        );
    }

    // === Faculty Functions ===

    public fun request_certificate(
        _: &FacultyCap,
        student: address,
        ipfs_hashes: vector<String>,
        ctx: &mut TxContext
    ) {
        let certificate = Certificate {
            id: object::new(ctx),
            student_address: student,
            ipfs_hashes,
            status: PENDING_UNIVERSITY,
            faculty_id: object::uid_to_inner(&ctx.id),
            signature: vector::empty()
        };

        event::emit(CertificateRequested {
            certificate_id: object::uid_to_inner(&certificate.id),
            student
        });

        transfer::share_object(certificate);
    }

    // === University Functions ===

    public fun approve_by_university(
        _: &UniversityCap,
        certificate: &mut Certificate
    ) {
        assert!(certificate.status == PENDING_UNIVERSITY, E_INVALID_STATE);
        certificate.status = PENDING_MINISTRY;
    }

    // === Ministry Functions ===

    public fun approve_final(
        _: &MinistryCap,
        certificate: &mut Certificate,
        signature: vector<u8>,
        payment: Coin<CER>,
        ctx: &mut TxContext
    ) {
        assert!(certificate.status == PENDING_MINISTRY, E_INVALID_STATE);
        
        // Verify payment
        assert!(coin::value(&payment) >= 100, E_INVALID_STATE);
        
        certificate.status = APPROVED;
        certificate.signature = signature;

        // Mint NFT SoulBound Token cho student
        // TODO: Implement NFT minting logic
        
        event::emit(CertificateApproved {
            certificate_id: object::uid_to_inner(&certificate.id),
            approver: tx_context::sender(ctx)
        });
    }

    // === Student Functions === 

    public fun claim_certificate(
        certificate: &Certificate,
        ctx: &mut TxContext
    ) {
        assert!(certificate.status == APPROVED, E_INVALID_STATE);
        assert!(certificate.student_address == tx_context::sender(ctx), E_NOT_AUTHORIZED);
        
        // TODO: Transfer NFT to student wallet
    }
}