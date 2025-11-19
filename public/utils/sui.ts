
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SuiClient } from '@mysten/sui.js/client';

// CONFIG
const PACKAGE_ID = "0x2f9b715ff8639f359f33c475410b4c0bda5d50f2a7ab9d15a87d3848479fa393";
const MODULE_NAME = "certificate_request";

// ✅ THÊM: Export suiClient để dùng ở nơi khác
export const suiClient = new SuiClient({ 
  url: 'https://fullnode.testnet.sui.io:443' 
});

/**
 * 3️⃣ ROOT gửi danh sách yêu cầu lên blockchain
 */
export async function sendToMinistryOnChain(
  requestIds: string[], 
  signerAddress: string
): Promise<TransactionBlock> {
  const tx = new TransactionBlock();

  const idObjects = requestIds.map(id => tx.pure(id));

  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULE_NAME}::send_to_ministry`,
    arguments: [
      tx.pure(idObjects),
      tx.object('0x6'),
    ],
  });

  tx.setGasBudget(10000000);
  return tx;
}

/**
 * 4️⃣ ROOT duyệt 1 request cụ thể → cho phép mint
 * @param requestObjectId - ID của CertificateRequest object trên Sui
 * @param signerAddress - Địa chỉ ví ROOT
 */
export async function approveByMinistryOnChain(
  requestObjectId: string,
  signerAddress: string
): Promise<TransactionBlock> {
  const tx = new TransactionBlock();

  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULE_NAME}::approve_by_ministry`,
    arguments: [
      tx.object(requestObjectId), // &mut CertificateRequest
      tx.object('0x6'), // Clock object
    ],
  });

  tx.setGasBudget(10000000);
  return tx;
}

/**
 * 5️⃣ ROOT từ chối 1 request
 * @param requestObjectId - ID của CertificateRequest object trên Sui
 * @param reason - Lý do từ chối
 */
export async function rejectByMinistryOnChain(
  requestObjectId: string,
  reason: string
): Promise<TransactionBlock> {
  const tx = new TransactionBlock();

  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULE_NAME}::reject_by_ministry`,
    arguments: [
      tx.object(requestObjectId),
      tx.pure(reason), // String
      tx.object('0x6'), // Clock
    ],
  });

  tx.setGasBudget(10000000);
  return tx;
}

/**
 * Helper: Lấy thông tin request từ blockchain
 */
export async function getRequestInfo(requestObjectId: string) {
  try {
    const object = await suiClient.getObject({
      id: requestObjectId,
      options: { showContent: true },
    });
    return object.data?.content;
  } catch (error) {
    console.error('Error fetching request:', error);
    return null;
  }
}

/**
 * Helper: Lắng nghe event từ smart contract
 */
export async function listenToMinistryEvents(packageId: string) {
  // TODO: Implement event subscription logic
  // Có thể dùng Sui SDK hoặc WebSocket
}

/**
 * 6️⃣ Lấy danh sách các request đã gửi lên Ministry (từ events)
 * @returns Danh sách request IDs
 */
export async function getMinistryRequests(): Promise<string[]> {
  try {
    // Query events từ smart contract
    const events = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::${MODULE_NAME}::RequestSentToMinistry`
      },
      limit: 50,
      order: 'descending'
    });

    // ✅ FIX: Add proper type casting
    return events.data.map(event => {
      const parsedJson = event.parsedJson as { request_id?: string };
      return parsedJson?.request_id || '';
    }).filter(id => id !== ''); // Remove empty strings
  } catch (error) {
    console.error('Error fetching ministry requests:', error);
    return [];
  }
}

/**
 * 7️⃣ Lấy trạng thái chi tiết của 1 request
 * @param requestObjectId - ID của CertificateRequest object
 */
export async function getRequestDetails(requestObjectId: string) {
  try {
    const object = await suiClient.getObject({
      id: requestObjectId,
      options: { 
        showContent: true,
        showType: true 
      }
    });

    if (object.data?.content?.dataType === 'moveObject') {
      const fields = object.data.content.fields as any;
      return {
        student_email: fields.student_email,
        admin_org_email: fields.admin_org_email,
        org_email: fields.org_email,
        status: fields.status,
        ministry_approved: fields.ministry_approved,
        created_at: fields.created_at,
        ipfs_cid: fields.ipfs_cid
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching request details:', error);
    return null;
  }
}

/**
 * 8️⃣ Tạo request object mới trên blockchain (khi org tạo yêu cầu)
 * @param studentEmail - Email sinh viên
 * @param adminOrgEmail - Email admin khoa
 * @param orgEmail - Email trường
 * @param ipfsCid - IPFS CID của metadata
 */
export async function createRequestOnChain(
  studentEmail: string,
  adminOrgEmail: string,
  orgEmail: string,
  ipfsCid: string
): Promise<TransactionBlock> {
  const tx = new TransactionBlock();

  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULE_NAME}::create_request`,
    arguments: [
      tx.pure(studentEmail),
      tx.pure(adminOrgEmail),
      tx.pure(orgEmail),
      tx.pure(ipfsCid),
      tx.object('0x6'), // Clock object
    ],
  });

  tx.setGasBudget(10000000);
  return tx;
}