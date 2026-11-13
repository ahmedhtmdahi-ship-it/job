import {getTranslations} from 'next-intl/server';
import {getOpportunityFeed} from '@/actions/opportunity.actions';
import OpportunityFeed from '@/components/opportunities/OpportunityFeed';
export async function generateMetadata(){const t=await getTranslations('opportunities');return {title:t('title')};}
export default async function Page(){return <OpportunityFeed data={await getOpportunityFeed()}/>;}
