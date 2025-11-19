module certificate_request::certificate_request {
    use std::string::String;
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::clock::{Self, Clock};
    use sui::event;
    use sui::coin::{Self, Coin};
    use sui::transfer;
    use sui::sui::SUI; // Import SUI token

    // === Errors ===
    const ENotAuthorized: u64 = 1;
    const EInvalidStatus: u64 = 2;
    const EInsufficientPayment: u64 = 3;

    // === STATUS ===
    const STATUS_PENDING_UNIVERSITY: u8 = 1;
    const STATUS_WAITING_MINISTRY: u8 = 2;
    const STATUS_READY_TO_MINT: u8 = 3;
    const STATUS_REJECTED: u8 = 5;

    // === ROOT ADDRESS (Bộ GD) ===
    const ROOT_ADDRESS: address = @root;

    // === PHÍ SUI (0.1 SUI = 100_000_000 MIST) ===
    const FEE: u64 = 100_000_000; // 0.1 SUI

    // === STRUCT ===
    public struct CertificateRequest has key, store {
        id: UID,
        student: address,
        university: address,
        ipfs_cid: String,
        status: u8,
        created_at: u64,
        updated_at: u64,
    }

    // === EVENTS ===
    public struct StudentRequestCreated has copy, drop {
        request_id: ID,
        student: address,
        ipfs_cid: String,
    }

    public struct UniversityVerifiedEvent has copy, drop {
        request_id: ID,
        university: address,
        timestamp: u64,
    }

    public struct SendToMinistryEvent has copy, drop {
        request_ids: vector<ID>,
        university: address,
        timestamp: u64,
    }

    public struct MinistryApprovedEvent has copy, drop {
        request_id: ID,
        timestamp: u64,
    }

    public struct MinistryRejectedEvent has copy, drop {
        request_id: ID,
        reason: String,
        timestamp: u64,
    }

    // ==================================================================
    // 1. ORG (TRƯỜNG) TẠO REQUEST
    // ==================================================================
    public fun create_request(
        student: address,
        university: address,
        ipfs_cid: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == university, ENotAuthorized); // Chỉ Trường gọi

        let now = clock::timestamp_ms(clock);
        let req = CertificateRequest {
            id: object::new(ctx),
            student,
            university,
            ipfs_cid,
            status: STATUS_PENDING_UNIVERSITY,
            created_at: now,
            updated_at: now,
        };

        event::emit(StudentRequestCreated {
            request_id: object::uid_to_inner(&req.id),
            student,
            ipfs_cid,
        });

        transfer::share_object(req);
    }

    // ==================================================================
    // 2. ORG (TRƯỜNG) XÁC NHẬN + TRẢ PHÍ SUI
    // ==================================================================
    public fun verify_by_university(
        request: &mut CertificateRequest,
        mut payment: Coin<SUI>, // Thay đổi: Sử dụng Coin<SUI>
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == request.university, ENotAuthorized);
        assert!(request.status == STATUS_PENDING_UNIVERSITY, EInvalidStatus);

        let value = coin::value(&payment);
        assert!(value >= FEE, EInsufficientPayment);

        // Split phí SUI và chuyển về ví ROOT (Bộ GD)
        let fee_coin = coin::split(&mut payment, FEE, ctx);
        transfer::public_transfer(fee_coin, ROOT_ADDRESS);

        // Hoàn trả số dư nếu trả thừa
        if (value > FEE) {
            transfer::public_transfer(payment, sender);
        } else {
            coin::destroy_zero(payment);
        };

        request.status = STATUS_WAITING_MINISTRY;
        request.updated_at = clock::timestamp_ms(clock);

        event::emit(UniversityVerifiedEvent {
            request_id: object::uid_to_inner(&request.id),
            university: request.university,
            timestamp: request.updated_at,
        });
    }

    // ==================================================================
    // 3. ORG GỬI DANH SÁCH LÊN BỘ (OFF-CHAIN TRIGGER)
    // ==================================================================
    public fun send_to_ministry(
        request_ids: vector<ID>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        // Không check university → backend sẽ validate danh sách
        event::emit(SendToMinistryEvent {
            request_ids,
            university: sender,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    // ==================================================================
    // 4. ROOT (BỘ GD) DUYỆT → CHO PHÉP MINT
    // ==================================================================
    public fun approve_by_ministry(
        request: &mut CertificateRequest,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == ROOT_ADDRESS, ENotAuthorized);
        assert!(request.status == STATUS_WAITING_MINISTRY, EInvalidStatus);

        request.status = STATUS_READY_TO_MINT;
        request.updated_at = clock::timestamp_ms(clock);

        event::emit(MinistryApprovedEvent {
            request_id: object::uid_to_inner(&request.id),
            timestamp: request.updated_at,
        });
    }

    // ==================================================================
    // 5. ROOT (BỘ GD) TỪ CHỐI
    // ==================================================================
    public entry fun reject_by_ministry(
        request: &mut CertificateRequest,
        reason: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == ROOT_ADDRESS, ENotAuthorized);

        request.status = STATUS_REJECTED;
        request.updated_at = clock::timestamp_ms(clock);

        event::emit(MinistryRejectedEvent {
            request_id: object::uid_to_inner(&request.id),
            reason,
            timestamp: request.updated_at,
        });
    }

    // HELPER FUNCTIONS
    // ==================================================================
    public fun get_request_status(request: &CertificateRequest): u8 { request.status }
    public fun is_ready_to_mint(request: &CertificateRequest): bool { request.status == STATUS_READY_TO_MINT }
    public fun get_student(request: &CertificateRequest): address { request.student }
    public fun get_university(request: &CertificateRequest): address { request.university }
    public fun get_ipfs_cid(request: &CertificateRequest): String { request.ipfs_cid }
}


//     "data": {
//       "objectId": "0x6b834599d5f4f256ab3ba0745245b34bea92eddf2d659ee5c78c6e231288a7ae",       
//       "version": "349180633",
//       "digest": "BhV6qbJJU5ySZwxuq82nFaUtXqZ2Bg8VELgMgxrMT3fq",
//       "type": "0x2::package::UpgradeCap",
//       "owner": {
//         "AddressOwner": "0xf907bf58ffb41629bc0fb01a8940e84b1653a6c02eda59356ae88ca87f0d377f"  
//       },
//       "previousTransaction": "6wajMcTxJTGgiYLGQqhzwhTaZnx15AYFVewwZHSoNHhj",
//       "storageRebate": "1634000",
//       "content": {
//         "dataType": "moveObject",
//         "type": "0x2::package::UpgradeCap",
//         "hasPublicTransfer": true,
//         "fields": {
//           "id": {
//             "id": "0x6b834599d5f4f256ab3ba0745245b34bea92eddf2d659ee5c78c6e231288a7ae"        
//           },
//           "package": "0x2f9b715ff8639f359f33c475410b4c0bda5d50f2a7ab9d15a87d3848479fa393",    
//           "policy": 0,
//           "version": "1"
//         }
//       }
//     }
//   },