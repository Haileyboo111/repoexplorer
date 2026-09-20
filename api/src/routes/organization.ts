import { Router } from 'express';
import { BASE_ORGANIZATION, FILTERABLE_ORGS_FIELDS } from '../consts';
import type { Resp, RespOrganization } from '../types/routes';
import type { orgsData } from '../types/appData';
import sampleOrgsData from '../../data/sample/sampleOrgsData.json';
import { getPercentFieldNotNull, makeCountsArray, makeDateDistributionArray, makeProfileCompleteDistributionArray } from '../utils/math';
import { filterData } from '../utils/filter';

const data = sampleOrgsData as orgsData[];
const router = Router();

// Create endpoint map: the string is the /destination and the function call gets the appropriate data
const SUB_ENDPOINTS = {
    totalOrganizations: (data: orgsData[]) => data.length,
    percentOrganizationsURL: (data: orgsData[]) => getPercentFieldNotNull(data, 'url'),
    percentOrganizationsDescription: (data: orgsData[]) => getPercentFieldNotNull(data, 'description'),
    percentOrganizationsEmail: (data: orgsData[]) => getPercentFieldNotNull(data, 'email'),
    orgsPerUniversity: (data: orgsData[]) => makeCountsArray(data, 'university'),
    orgsCreatedPerYear: (data: orgsData[]) => makeDateDistributionArray(data, 'createdAt'),
    profileCompleteness: (data: orgsData[]) => makeProfileCompleteDistributionArray(data)
} satisfies Partial<Record<keyof RespOrganization, (data: orgsData[]) => Resp[string]>>;

// Register primary GET response: build and return full RespOrganization object
router.get(BASE_ORGANIZATION, (req, res) => {
    const filtered = filterData(data, req.query, FILTERABLE_ORGS_FIELDS);
    res.json(
        Object.fromEntries(
            Object.entries(SUB_ENDPOINTS).map(([endpoint, fn]) => [endpoint, fn(filtered) as RespOrganization]),
        ),
    );
});

// Register sub GET responses for each field
// (e.g. /ORGANIZATION/totalOrganizations returns only the return value of getUniqueCount(data))
for (const [endpoint, fn] of Object.entries(SUB_ENDPOINTS)) {
    router.get(`${BASE_ORGANIZATION}/${endpoint}`, (req, res) => {
        const filtered = filterData(data, req.query, FILTERABLE_ORGS_FIELDS);
        const value = fn(filtered) as RespOrganization[keyof RespOrganization];
        res.json({ [endpoint]: value } satisfies Partial<RespOrganization>);
    });
}

export default router;
