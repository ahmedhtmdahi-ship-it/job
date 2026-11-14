import {getTranslations} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {getProposalData} from '@/actions/proposal.actions';
import ProposalEditor from '@/components/proposals/ProposalEditor';
export async function generateMetadata(){const t=await getTranslations('proposals');return {title:t('title')};}
export default async function Page({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  try {
    const data=await getProposalData(id);
    return <ProposalEditor key={`${data.proposal.version}-${data.proposal.updatedAt.toISOString()}-${data.profileHash}`} data={data}/>;
  } catch(error) {
    if(error instanceof Error && error.message==='notFound') notFound();
    throw error;
  }
}
